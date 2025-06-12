import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Fitness profile data
  age: integer("age"),
  gender: varchar("gender"),
  height: integer("height"), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  
  // --- FIX: Increased precision to prevent overflow ---
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 5, scale: 2 }),
  
  fitnessLevel: varchar("fitness_level"), // Beginner, Intermediate, Advanced
  fitnessGoal: varchar("fitness_goal"), // Muscle Gain, Fat Loss, Recomposition
  fatLevel: varchar("fat_level"), // Very Low, Low, Average, Slightly Obese, Obese
  
  // RPG progression
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  rank: varchar("rank").default("E-Rank Human"),
  characterClass: varchar("character_class"), // unlocked at level 10
  
  // RPG stats
  strength: integer("strength").default(10),
  endurance: integer("endurance").default(10),
  wisdom: integer("wisdom").default(10),
  discipline: integer("discipline").default(10),
  
  // Profile completion
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  exercises: jsonb("exercises"),
  totalVolume: decimal("total_volume", { precision: 10, scale: 2 }),
  duration: integer("duration"),
  notes: text("notes"),
  photoUrl: varchar("photo_url"),
  xpGained: integer("xp_gained").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").default(0),
  goldReward: integer("gold_reward").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  title: varchar("title").notNull(),
  description: text("description"),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fats: decimal("fats", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMessages = pgTable("system_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull(), 
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations (no changes here)
export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  quests: many(quests),
  meals: many(meals),
  systemMessages: many(systemMessages),
}));
export const workoutsRelations = relations(workouts, ({ one }) => ({ user: one(users, { fields: [workouts.userId], references: [users.id] }) }));
export const questsRelations = relations(quests, ({ one }) => ({ user: one(users, { fields: [quests.userId], references: [users.id] }) }));
export const mealsRelations = relations(meals, ({ one }) => ({ user: one(users, { fields: [meals.userId], references: [users.id] }) }));
export const systemMessagesRelations = relations(systemMessages, ({ one }) => ({ user: one(users, { fields: [systemMessages.userId], references: [users.id] }) }));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// --- FIX: Added firstName and made it required ---
export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true, // Re-added
  lastName: true,
  age: true,
  gender: true,
  height: true,
  weight: true,
  bodyFatPercentage: true,
  fitnessLevel: true,
  fitnessGoal: true,
  fatLevel: true,
  onboardingCompleted: true,
  profileImageUrl: true,
}).extend({
  firstName: z.string().min(1, "Name is a required field."), // Made it required
  lastName: z.string().optional(),
  weight: z.union([z.string(), z.number()]).transform((val) => String(val)),
  bodyFatPercentage: z.union([z.string(), z.number(), z.undefined()]).transform((val) => val === undefined ? undefined : String(val)),
});

export const updateUserAvatarSchema = z.object({
  profileImageUrl: z.string().url("Invalid image URL."),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true, xpGained: true });
export const insertQuestSchema = createInsertSchema(quests).omit({ id: true, createdAt: true, userId: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, createdAt: true });
export const insertSystemMessageSchema = createInsertSchema(systemMessages).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserAvatar = z.infer<typeof updateUserAvatarSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type SystemMessage = typeof systemMessages.$inferSelect;
export type InsertSystemMessage = z.infer<typeof insertSystemMessageSchema>;