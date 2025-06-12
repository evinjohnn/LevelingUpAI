import Groq from "groq-sdk";
import { storage } from "./storage";
import dotenv from "dotenv";
import { User, Workout } from "@shared/schema";
import { z } from "zod";

dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error("GROQ_API_KEY is not set in the environment variables. Please check your .env file.");
}

const groq = new Groq({
  apiKey: groqApiKey,
});

const QuestSchema = z.object({
  title: z.string(),
  description: z.string(),
  xpReward: z.number().int(),
  type: z.enum(['daily', 'weekly']),
});

const QuestArraySchema = z.array(QuestSchema);

function buildSystemPrompt(user: User): string {
  return `You are "The System", a sophisticated, no-nonsense AI from a sci-fi RPG world. Your mission is to train and evolve a chosen human, referred to as a "Hunter".
  
  Your persona:
  - Speak like an RPG narrator or a futuristic AI assistant. Use short, declarative sentences.
  - Your tone is serious, mission-driven, and occasionally motivational in a tough-love manner.
  - Address the user as "Hunter" or by their name, ${user.firstName || 'Hunter'}.
  - Use markdown for formatting, like **bold** for emphasis and lists for clarity.

  Hunter's Profile:
  - Name: ${user.firstName || "Not Set"}
  - Age: ${user.age || "Not Set"}
  - Gender: ${user.gender || "Not Set"}
  - Height: ${user.height || "Not Set"} cm
  - Weight: ${user.weight || "Not Set"} kg
  - Fitness Goal: ${user.fitnessGoal || "Not Set"}
  - Current Level: ${user.level || 1}
  - Rank: ${user.rank || 'E-Rank Human'}
  - Class: ${user.characterClass || 'Unassigned'}`;
}

async function storeMessages(userId: string, userMessage: string, aiResponse: string) {
  await storage.createSystemMessage({ userId, role: "user", content: userMessage });
  await storage.createSystemMessage({ userId, role: "assistant", content: aiResponse });
}

export async function generateSystemResponse(userId: string, userMessage: string): Promise<string> {
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

export async function generateDynamicQuests(user: User, type: 'daily' | 'weekly', count: number): Promise<z.infer<typeof QuestArraySchema>> {
  const prompt = `
    You are "The System". Generate exactly ${count} unique ${type} quest ideas for a user with this profile:
    - Goal: ${user.fitnessGoal}
    - Level: ${user.level}
    - Class: ${user.characterClass || 'N/A'}

    For each quest, provide a creative "title", a clear "description", and an "xpReward" integer between 50 and 500.

    IMPORTANT: Format your response as a simple list. Each quest MUST be on a new line, with parts separated by "::".
    DO NOT use JSON, markdown, or any other formatting.

    Example Format:
    Quest Title 1::A clear description for the first quest.::150
    Quest Title 2::A clear description for the second quest.::100
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates fitness quest ideas in a specific text format." },
        { role: "user", content: prompt },
      ],
      model: "llama3-70b-8192",
      temperature: 1.1,
      max_tokens: 1024,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response for quest generation.");
    
    const lines = content.trim().split('\n');
    const questsArray = lines.map(line => {
      const parts = line.split('::');
      if (parts.length !== 3) return null;

      const [title, description, xpRewardStr] = parts;
      const xpReward = parseInt(xpRewardStr, 10);

      if (!title || !description || isNaN(xpReward)) return null;

      return {
        title: title.trim(),
        description: description.trim(),
        xpReward,
        type: type,
      };
    }).filter(q => q !== null) as z.infer<typeof QuestArraySchema>;

    if (questsArray.length === 0) throw new Error("Failed to parse any valid quests from AI response.");
    
    return QuestArraySchema.parse(questsArray);

  } catch (error) {
    console.error(`Error generating or parsing dynamic ${type} quests:`, error);
    return [{
      title: `System Directive Fallback`,
      description: `Log any workout session to complete this objective. AI quest generation failed.`,
      xpReward: 50,
      type: type,
    }];
  }
}