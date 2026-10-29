import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCache, setCache } from "./cache";
import crypto from "crypto";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function computeCacheKey(prompt: string, systemPrompt?: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(systemPrompt || "");
  hash.update(prompt);
  return `ai:cache:${hash.digest("hex")}`;
}

export interface GenerateTextOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  ttlSeconds?: number;
}

export async function generateText(prompt: string, options: GenerateTextOptions = {}): Promise<string> {
  const { systemPrompt, temperature = 0.2, maxTokens = 4096, ttlSeconds = 86400 } = options;
  const cacheKey = computeCacheKey(prompt, systemPrompt);

  // 1. Check cache
  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[AI Cache Hit] for key: ${cacheKey}`);
      return cached;
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  let textResult = "";

  // 2. Try Groq (Primary API)
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("[AI Client] Requesting Groq API...");
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const completion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature,
        max_completion_tokens: maxTokens,
      });

      textResult = completion.choices[0]?.message?.content || "";
      if (textResult) {
        console.log("[AI Client] Groq API call succeeded.");
      }
    } catch (err) {
      console.error("[AI Client] Groq API call failed. Falling back to Google Gemini...", err);
    }
  }

  // 3. Fallback to Google Gemini (gemini-flash-latest)
  if (!textResult) {
    try {
      console.log("[AI Client] Requesting Gemini API (Fallback)...");
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      // If systemInstruction is set in config, we initialize model with it
      const configuredModel = systemPrompt 
        ? genAI.getGenerativeModel({ model: "gemini-flash-latest", systemInstruction: systemPrompt })
        : model;

      const result = await configuredModel.generateContent(prompt);
      textResult = result.response.text().trim();
      if (textResult) {
        console.log("[AI Client] Gemini API fallback succeeded.");
      }
    } catch (err) {
      console.error("[AI Client] Gemini API fallback failed:", err);
      throw new Error("AI Service is temporarily unavailable. Please try again later.");
    }
  }

  // 4. Save to Cache
  if (textResult) {
    try {
      await setCache(cacheKey, textResult, ttlSeconds);
    } catch (err) {
      console.error("Cache write error:", err);
    }
  }

  return textResult;
}

export async function generateJson<T = any>(prompt: string, options: GenerateTextOptions = {}): Promise<T> {
  const rawText = await generateText(prompt, options);
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error("Failed to parse JSON from AI response:", cleaned);
    throw new Error("AI did not return structured JSON content as required. Please retry.");
  }
}
