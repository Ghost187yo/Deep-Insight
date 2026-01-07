
import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { MODEL_PRO, MODEL_FLASH, THINKING_BUDGET, SYSTEM_INSTRUCTION } from "../constants";
import { Source, IntelligenceMode, ActionItem } from "../types";

export class GeminiService {
  async *streamQuery(
    prompt: string, 
    history: { role: 'user' | 'model', parts: Part[] }[], 
    mode: IntelligenceMode,
    image?: string
  ) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const model = mode === 'reasoning' ? MODEL_PRO : MODEL_FLASH;

    const userParts: Part[] = [];
    if (image) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(',')[1] // Strip prefix
        }
      });
    }
    userParts.push({ text: prompt });

    try {
      const config: any = {
        systemInstruction: SYSTEM_INSTRUCTION,
      };

      if (mode === 'reasoning') {
        config.tools = [{ googleSearch: {} }];
        config.thinkingConfig = { thinkingBudget: THINKING_BUDGET };
      }

      const responseStream = await ai.models.generateContentStream({
        model: model,
        contents: [
          ...history,
          { role: 'user', parts: userParts }
        ],
        config: config,
      });

      let accumulatedText = "";
      const sources: Source[] = [];

      for await (const chunk of responseStream) {
        const textChunk = chunk.text || "";
        accumulatedText += textChunk;

        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((c: any) => {
            if (c.web) {
              const source: Source = {
                title: c.web.title || 'Untitled Source',
                url: c.web.uri
              };
              if (!sources.find(s => s.url === source.url)) {
                sources.push(source);
              }
            }
          });
        }

        yield {
          text: accumulatedText,
          sources: [...sources],
          done: false
        };
      }

      yield {
        text: accumulatedText,
        sources: [...sources],
        done: true
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async getActionItems(history: { role: 'user' | 'model', parts: Part[] }[]): Promise<ActionItem[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: [
          ...history,
          { 
            role: 'user', 
            parts: [{ text: "Based on our conversation above, extract all actionable tasks, key decisions, or upcoming items. Be specific." }] 
          }
        ],
        config: {
          systemInstruction: "You are a professional project coordinator. Extract actionable tasks from the conversation and categorize them by priority.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task: { type: Type.STRING, description: "The specific actionable item." },
                priority: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The importance of the task." },
                context: { type: Type.STRING, description: "Brief context or reason for this task." }
              },
              required: ["task", "priority"]
            }
          }
        }
      });

      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (error) {
      console.error("Action extraction error:", error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
