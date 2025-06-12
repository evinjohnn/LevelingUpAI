import {
  users,
  workouts,
  quests,
  meals,
  systemMessages,
  type User,
  type UpsertUser,
  type UpdateUserProfile,
  type Workout,
  type InsertWorkout,
  type Quest,
  type InsertQuest,
  type Meal,
  type InsertMeal,
  type SystemMessage,
  type InsertSystemMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { generateDynamicQuests } from "./groq"; // Note: generateWorkoutAnalysis is no longer imported

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profile: Partial<UpdateUserProfile>): Promise<User>; // Allow partial updates
  updateUserXP(id: string, xpGain: number): Promise<User>;
  updateUserStats(id: string, stats: { strength?: number; endurance?: number; wisdom?: number; discipline?: number }): Promise<User>;
  getLeaderboard(limit?: number): Promise<Partial<User>[]>;
  deleteUserAndData(userId: string): Promise<void>;
  
  // Workout operations
  getWorkouts(userId: string, limit?: number): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<{ newWorkout: Workout; analysis: { progressiveOverload: boolean; xpGained: number; message: string } }>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  
  // Quest operations
  getUserQuests(userId: string, type?: string): Promise<Quest[]>;
  createQuest(quest: InsertQuest & { userId: string }): Promise<Quest>;
  completeQuest(questId: number): Promise<Quest>;
  generateDailyQuests(userId: string): Promise<Quest[]>;
  generateWeeklyQuests(userId: string): Promise<Quest[]>;
  
  // Meal operations
  getUserMeals(userId: string, date?: Date): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  
  // System message operations
  getSystemMessages(userId: string, limit?: number): Promise<SystemMessage[]>;
  createSystemMessage(message: InsertSystemMessage): Promise<SystemMessage>;

  // Weekly volume operations
  getWeeklyVolume(userId: string): Promise<{ week: string; totalVolume: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async deleteUserAndData(userId: string): Promise<void> {
    await db.delete(quests).where(eq(quests.userId, userId));
    await db.delete(workouts).where(eq(workouts.userId, userId));
    await db.delete(meals).where(eq(meals.userId, userId));
    await db.delete(systemMessages).where(eq(systemMessages.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    console.log(`Deleted orphaned user and all related data for ID: ${userId}`);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUserById = await this.getUser(userData.id);

    if (existingUserById) {
      const [updatedUser] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updatedUser;
    }

    if (userData.email) {
      const [orphanedUserByEmail] = await db.select().from(users).where(eq(users.email, userData.email));
      if (orphanedUserByEmail) {
        console.warn(`Orphaned user profile found for email ${userData.email}. Deleting old data before creating new profile.`);
        await this.deleteUserAndData(orphanedUserByEmail.id);
      }
    }
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUserProfile(id: string, profile: Partial<UpdateUserProfile>): Promise<User> {
    let updateData: Partial<User> = { ...profile, updatedAt: new Date() };

    if (profile.bodyFatPercentage) {
      const bf = parseFloat(profile.bodyFatPercentage.toString());
      if (bf < 10) updateData.fatLevel = "Very Low";
      else if (bf < 15) updateData.fatLevel = "Low";
      else if (bf < 25) updateData.fatLevel = "Average";
      else if (bf < 35) updateData.fatLevel = "Slightly Obese";
      else updateData.fatLevel = "Obese";
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getLeaderboard(limit = 100): Promise<Partial<User>[]> {
    return db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        level: users.level,
        xp: users.xp,
        rank: users.rank,
        profileImageUrl: users.profileImageUrl,
      })
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  async updateUserXP(id: string, xpGain: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const newXP = (user.xp || 0) + xpGain;
    let newLevel = user.level || 1;
    let newRank = "E-Rank Human";

    newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    if (newLevel >= 20) newRank = "S-Rank Hunter";
    else if (newLevel >= 15) newRank = "A-Rank Hunter";
    else if (newLevel >= 12) newRank = "B-Rank Hunter";
    else if (newLevel >= 10) newRank = "C-Rank Warrior";
    else if (newLevel >= 5) newRank = "D-Rank Trainee";

    const [updatedUser] = await db
      .update(users)
      .set({ xp: newXP, level: newLevel, rank: newRank, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async updateUserStats(id: string, stats: { strength?: number; endurance?: number; wisdom?: number; discipline?: number }): Promise<User> {
    const updateData: any = { ...stats, updatedAt: new Date() };
    
    if (stats.strength) updateData.strength = sql`${users.strength} + ${stats.strength}`;
    if (stats.endurance) updateData.endurance = sql`${users.endurance} + ${stats.endurance}`;
    if (stats.wisdom) updateData.wisdom = sql`${users.wisdom} + ${stats.wisdom}`;
    if (stats.discipline) updateData.discipline = sql`${users.discipline} + ${stats.discipline}`;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getWorkouts(userId: string, limit = 20): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date))
      .limit(limit);
  }

  async createWorkout(workout: InsertWorkout): Promise<{ newWorkout: Workout; analysis: { progressiveOverload: boolean; xpGained: number; message: string } }> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
    const recentWorkouts = await db
      .select({ totalVolume: workouts.totalVolume, date: workouts.date })
      .from(workouts)
      .where(and(eq(workouts.userId, workout.userId), gte(workouts.date, twoWeeksAgo)));
  
    let lastWeekVolume = 0;
    let previousWeekVolume = 0;
  
    for (const w of recentWorkouts) {
      const workoutDate = new Date(w.date || now);
      const volume = parseFloat(w.totalVolume?.toString() || '0');
  
      if (workoutDate > oneWeekAgo) {
        lastWeekVolume += volume;
      } else {
        previousWeekVolume += volume;
      }
    }
  
    const newTotalVolume = parseFloat(workout.totalVolume?.toString() || '0');
    lastWeekVolume += newTotalVolume;
  
    const progressiveOverload = lastWeekVolume > previousWeekVolume;
    const baseXP = 50;
    const volumeBonus = Math.floor(newTotalVolume / 100);
    const xpGained = baseXP + volumeBonus;
    const message = progressiveOverload
      ? `Progressive Overload DETECTED! Your strength grows, Hunter. Last week: ${previousWeekVolume.toFixed(0)}kg. This week: ${lastWeekVolume.toFixed(0)}kg.`
      : `Training recorded. Consistent effort is key. Last week: ${previousWeekVolume.toFixed(0)}kg. This week: ${lastWeekVolume.toFixed(0)}kg. Push harder next time.`;
  
    const [newWorkout] = await db
      .insert(workouts)
      .values({ ...workout, xpGained })
      .returning();
  
    await this.updateUserXP(workout.userId, xpGained);
  
    const strengthGain = Math.floor(newTotalVolume / 2000);
    const enduranceGain = Math.floor((workout.duration || 0) / 30);
    
    await this.updateUserStats(workout.userId, {
      strength: strengthGain,
      endurance: enduranceGain,
    });
    
    // The AI analysis part that was causing the error has been removed.
    // We can add it back later with a simpler prompt if needed.
    
    return { newWorkout, analysis: { progressiveOverload, xpGained, message } };
  }

  async getWorkoutById(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async getUserQuests(userId: string, type?: string): Promise<Quest[]> {
    const conditions = [eq(quests.userId, userId)];
    if (type) {
      conditions.push(eq(quests.type, type));
    }

    return await db
      .select()
      .from(quests)
      .where(and(...conditions))
      .orderBy(desc(quests.createdAt));
  }

  async createQuest(quest: InsertQuest & { userId: string }): Promise<Quest> {
    const [newQuest] = await db.insert(quests).values(quest).returning();
    return newQuest;
  }

  async completeQuest(questId: number): Promise<Quest> {
    const [quest] = await db
      .update(quests)
      .set({ completed: true, completedAt: new Date() })
      .where(and(eq(quests.id, questId), eq(quests.completed, false)))
      .returning();

    if (quest?.xpReward) {
      await this.updateUserXP(quest.userId, quest.xpReward);
    }

    return quest;
  }

  async generateDailyQuests(userId: string): Promise<Quest[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.delete(quests).where(and(eq(quests.userId, userId), eq(quests.type, "daily")));

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found for quest generation.");

    const dynamicQuests = await generateDynamicQuests(user, 'daily', 3);
    
    const createdQuests: Quest[] = [];
    for (const q of dynamicQuests) {
      const [newQuest] = await db.insert(quests).values({ ...q, userId }).returning();
      createdQuests.push(newQuest);
    }
    return createdQuests;
  }

  async generateWeeklyQuests(userId: string): Promise<Quest[]> {
    await db.delete(quests).where(and(eq(quests.userId, userId), eq(quests.type, "weekly")));

    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found for quest generation.");

    const dynamicQuests = await generateDynamicQuests(user, 'weekly', 2);
    
    const createdQuests: Quest[] = [];
    for (const q of dynamicQuests) {
      const [newQuest] = await db.insert(quests).values({ ...q, userId }).returning();
      createdQuests.push(newQuest);
    }
    return createdQuests;
  }

  async getUserMeals(userId: string, date?: Date): Promise<Meal[]> {
    const conditions = [eq(meals.userId, userId)];
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(gte(meals.date, startOfDay));
      conditions.push(lte(meals.date, endOfDay));
    }

    return await db
      .select()
      .from(meals)
      .where(and(...conditions))
      .orderBy(desc(meals.date));
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    
    await this.updateUserStats(meal.userId, { discipline: 1 });

    return newMeal;
  }

  async getSystemMessages(userId: string, limit = 50): Promise<SystemMessage[]> {
    return await db
      .select()
      .from(systemMessages)
      .where(eq(systemMessages.userId, userId))
      .orderBy(desc(systemMessages.createdAt))
      .limit(limit);
  }

  async createSystemMessage(message: InsertSystemMessage): Promise<SystemMessage> {
    const [newMessage] = await db.insert(systemMessages).values(message).returning();
    
    if (message.role === "user") {
      await this.updateUserStats(message.userId, { wisdom: 1 });
    }

    return newMessage;
  }

  async getWeeklyVolume(userId: string): Promise<{ week: string; totalVolume: number }[]> {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const userWorkouts = await db
      .select({
        date: workouts.date,
        totalVolume: workouts.totalVolume,
      })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), gte(workouts.date, twelveWeeksAgo)))
      .orderBy(desc(workouts.date));

    const weeklyData: { [week: string]: number } = {};

    userWorkouts.forEach((w) => {
      const date = new Date(w.date!);
      const year = date.getUTCFullYear();
      const weekNum = Math.ceil((((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getUTCDay() + 1) / 7);
      const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = 0;
      }
      weeklyData[weekKey] += parseFloat(w.totalVolume?.toString() || '0');
    });

    return Object.entries(weeklyData)
      .map(([week, totalVolume]) => ({ week, totalVolume }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }
}

export const storage = new DatabaseStorage();