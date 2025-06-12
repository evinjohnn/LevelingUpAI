import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSystemResponse } from "./groq";
import { 
  updateUserProfileSchema, 
  updateUserAvatarSchema,
  insertWorkoutSchema, 
  insertMealSchema,
  insertSystemMessageSchema 
} from "@shared/schema";
import { z } from "zod";

// Enhanced authentication middleware with better error handling
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized - No token provided" 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // More robust JWT payload extraction with validation
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      if (!payload.sub) {
        return res.status(401).json({ 
          success: false,
          message: "Unauthorized - Invalid token payload" 
        });
      }

      // Add user info to request with proper typing
      (req as any).user = { 
        id: payload.sub, 
        email: payload.email || null 
      };
      
      next();
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized - Malformed token" 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: "Internal authentication error" 
    });
  }
};

// Helper function for consistent error responses
const handleError = (res: Response, error: any, defaultMessage: string, statusCode: number = 500) => {
  console.error(defaultMessage, error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.errors
    });
  }
  
  return res.status(statusCode).json({
    success: false,
    message: defaultMessage,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Enhanced auth route with better error handling
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);
      
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.email,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        });
      }
      
      res.json({ success: true, data: user });
    } catch (error) {
      handleError(res, error, "Failed to fetch user");
    }
  });

  // Enhanced profile update route with your improvements
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const body = req.body;
      let updatedUser;

      // Avatar-only update
      if (body.profileImageUrl && Object.keys(body).length === 1) {
        const avatarData = updateUserAvatarSchema.parse(body);
        updatedUser = await storage.updateUserProfile(userId, avatarData);
      }
      // Character class update
      else if (body.characterClass && Object.keys(body).length === 1) {
        // Add validation schema for character class if needed
        const characterClassData = z.object({
          characterClass: z.string().min(1)
        }).parse(body);
        updatedUser = await storage.updateUserProfile(userId, characterClassData);
      }
      // Full profile update (onboarding)
      else {
        const profileData = updateUserProfileSchema.parse(body);
        updatedUser = await storage.updateUserProfile(userId, profileData);
        
        // Generate quests after onboarding completion
        if (profileData.onboardingCompleted) {
          try {
            await Promise.all([
              storage.generateDailyQuests(userId),
              storage.generateWeeklyQuests(userId)
            ]);
          } catch (questError) {
            console.warn('Failed to generate quests after onboarding:', questError);
            // Don't fail the entire request if quest generation fails
          }
        }
      }

      res.json({ success: true, data: updatedUser });
    } catch (error) {
      handleError(res, error, "Failed to update profile");
    }
  });

  // Enhanced workout routes
  app.get('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // Validate limit parameter
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          message: "Invalid limit parameter. Must be between 1 and 100."
        });
      }
      
      const workouts = await storage.getWorkouts(userId, limit);
      res.json({ success: true, data: workouts });
    } catch (error) {
      handleError(res, error, "Failed to fetch workouts");
    }
  });

  app.post('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workoutData = insertWorkoutSchema.parse({
        ...req.body,
        userId,
      });
      
      const result = await storage.createWorkout(workoutData);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      handleError(res, error, "Failed to create workout", 400);
    }
  });

  // Enhanced quest routes with better error handling
  app.get('/api/quests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const type = req.query.type as string;
      
      // Validate quest type if provided
      if (type && !['daily', 'weekly', 'special'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quest type. Must be 'daily', 'weekly', or 'special'."
        });
      }
      
      const quests = await storage.getUserQuests(userId, type);
      res.json({ success: true, data: quests });
    } catch (error) {
      handleError(res, error, "Failed to fetch quests");
    }
  });

  app.post('/api/quests/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const quests = await storage.generateDailyQuests(userId);
      res.json({ success: true, data: quests });
    } catch (error) {
      handleError(res, error, "Failed to generate daily quests");
    }
  });

  app.post('/api/quests/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const quests = await storage.generateWeeklyQuests(userId);
      res.json({ success: true, data: quests });
    } catch (error) {
      handleError(res, error, "Failed to generate weekly quests");
    }
  });

  app.patch('/api/quests/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const questId = parseInt(req.params.id);
      
      if (isNaN(questId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quest ID"
        });
      }
      
      const quest = await storage.completeQuest(questId);
      res.json({ success: true, data: quest });
    } catch (error) {
      handleError(res, error, "Failed to complete quest", 400);
    }
  });

  // Enhanced meal routes
  app.get('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let date: Date | undefined;
      
      if (req.query.date) {
        date = new Date(req.query.date as string);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format"
          });
        }
      }
      
      const meals = await storage.getUserMeals(userId, date);
      res.json({ success: true, data: meals });
    } catch (error) {
      handleError(res, error, "Failed to fetch meals");
    }
  });

  app.post('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mealData = insertMealSchema.parse({
        ...req.body,
        userId,
      });
      
      const meal = await storage.createMeal(mealData);
      res.status(201).json({ success: true, data: meal });
    } catch (error) {
      handleError(res, error, "Failed to create meal", 400);
    }
  });

  // Enhanced system AI routes
  app.get('/api/system/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          message: "Invalid limit parameter. Must be between 1 and 100."
        });
      }
      
      const messages = await storage.getSystemMessages(userId, limit);
      res.json({ success: true, data: messages });
    } catch (error) {
      handleError(res, error, "Failed to fetch system messages");
    }
  });

  app.post('/api/system/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Valid message is required"
        });
      }
      
      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Message too long. Maximum 1000 characters."
        });
      }
      
      const response = await generateSystemResponse(userId, message.trim());
      res.json({ success: true, data: { response } });
    } catch (error) {
      console.error("Error generating system response:", error);
      res.status(503).json({ 
        success: false,
        message: "The System is temporarily unavailable" 
      });
    }
  });

  // Enhanced leaderboard route
  app.get('/api/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Invalid limit parameter. Must be between 1 and 100."
        });
      }
      
      const topUsers = await storage.getLeaderboard(limit);
      res.json({ success: true, data: topUsers });
    } catch (error) {
      handleError(res, error, "Failed to fetch leaderboard");
    }
  });

  // Enhanced stats routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
      
      const [workouts, quests] = await Promise.all([
        storage.getWorkouts(userId, 30),
        storage.getUserQuests(userId)
      ]);
      
      const completedQuests = quests.filter(q => q.completed);
      
      const stats = {
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        stats: {
          strength: user.strength,
          endurance: user.endurance,
          wisdom: user.wisdom,
          discipline: user.discipline,
        },
        progress: {
          totalWorkouts: workouts.length,
          totalXp: user.xp,
          questsCompleted: completedQuests.length,
          currentStreak: 0, // TODO: Calculate streak
        },
      };
      
      res.json({ success: true, data: stats });
    } catch (error) {
      handleError(res, error, "Failed to fetch stats");
    }
  });

  app.get('/api/stats/intensity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const weeklyVolume = await storage.getWeeklyVolume(userId);
      res.json({ success: true, data: weeklyVolume });
    } catch (error) {
      handleError(res, error, "Failed to fetch intensity data");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}