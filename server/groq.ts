// server/groq.ts

import Groq from "groq-sdk";
import { storage } from "./storage";
import dotenv from "dotenv";
import { User } from "@shared/schema";
import { z } from "zod";

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error("GROQ_API_KEY is not set in the environment variables.");
}

const groq = new Groq({
  apiKey: groqApiKey,
});

// --- SCHEMA & PROMPT FOR RELIABLE JSON OUTPUT ---

const QuestResponseSchema = z.object({
  quests: z.array(z.object({
    title: z.string(),
    description: z.string(),
    xpReward: z.number().int(),
  })),
});

// A more direct and robust prompt for the AI.
function buildQuestPrompt(user: User, type: 'daily' | 'weekly', count: number): string {
  const xpRange = type === 'daily' ? "50-200" : "250-500";
  return `
    Generate a JSON object for a fitness RPG app.
    The JSON object must have a single key "quests", which is an array of quest objects.
    Generate exactly ${count} unique ${type} quests for the user described below.

    USER PROFILE:
    - Goal: ${user.fitnessGoal}
    - Level: ${user.level}
    - Class: ${user.characterClass || 'N/A'}

    QUEST REQUIREMENTS:
    - Each quest object must have three keys: "title" (string), "description" (string, one sentence), and "xpReward" (integer between ${xpRange}).
    - Do not include any other keys or text outside the main JSON object.
  `;
}

// --- CORE QUEST GENERATION LOGIC ---

export async function generateDynamicQuests(user: User, type: 'daily' | 'weekly', count: number) {
  const prompt = buildQuestPrompt(user, type, count);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: "You are an assistant that only responds with valid JSON matching the user's requested schema." }, { role: "user", content: prompt }],
      model: "llama3-70b-8192",
      temperature: 1.1,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response.");

    const parsedJson = JSON.parse(content);
    const validationResult = QuestResponseSchema.safeParse(parsedJson);

    if (!validationResult.success) {
      console.error("AI response failed Zod validation:", validationResult.error);
      throw new Error("AI returned malformed quest data.");
    }
    
    // --- THIS IS THE FAILSAFE ---
    // If the AI successfully returns a valid schema but with an empty quest list,
    // we treat it as an error to trigger the fallback.
    if (validationResult.data.quests.length === 0) {
      throw new Error("AI returned an empty list of quests.");
    }

    return validationResult.data.quests.map(quest => ({ ...quest, type }));

  } catch (error) {
    console.error(`Error generating or parsing dynamic ${type} quests:`, error);
    // This fallback now correctly executes on any failure in the try block.
    return [{
      title: `System Directive Fallback`,
      description: `Log any workout session to complete this objective. AI quest generation failed.`,
      xpReward: 50,
      type: type,
    }];
  }
}


// --- Other functions in this file remain unchanged ---

function buildSystemPrompt(user: User): string {
  return `You are "The System", a sophisticated, no-nonsense AI from a sci-fi RPG world...`; // Keep your original prompt
}

async function storeMessages(userId: string, userMessage: string, aiResponse: string) {
  await storage.createSystemMessage({ userId, role: "user", content: userMessage });
  await storage.createSystemMessage({ userId, role: "assistant", content: aiResponse });
}

export async function generateSystemResponse(userId: string, userMessage: string): Promise<string> {
  // ... This function's logic is fine and does not need to be changed.
  // It is included here to show the full file context.
  try {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found for AI response generation.");
    const recentMessages = await storage.getSystemMessages(userId, 10);
    const systemPrompt = buildSystemPrompt(user);
    const messages: Groq.Chat.CompletionCreateParams.Message[] = [{ role: "system", content: systemPrompt }];
    recentMessages.reverse().forEach(msg => {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    });
    messages.push({ role: "user", content: userMessage });
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500,
    });
    const aiResponse = chatCompletion.choices[0]?.message?.content || "The System is processing your request...";
    await storeMessages(userId, userMessage, aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("Error generating Groq response:", error);
    return "The System is temporarily unavailable. A connection error occurred. Please try again.";
  }
}