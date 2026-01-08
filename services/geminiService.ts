
import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { MODEL_PRO, MODEL_FLASH, THINKING_BUDGET, SYSTEM_INSTRUCTION } from "../constants";
import { Source, IntelligenceMode, ActionItem, RecapData } from "../types";

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

  async getRecap(history: { role: 'user' | 'model', parts: Part[] }[]): Promise<RecapData> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: [
          ...history,
          { 
            role: 'user', 
            parts: [{ text: "Synthesize our conversation. Provide a high-level narrative summary (2-3 sentences) and a list of specific actionable tasks or key takeaways." }] 
          }
        ],
        config: {
          systemInstruction: "You are a professional strategist. Analyze the chat history and extract both a narrative executive summary and structured tasks categorized by priority.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A concise executive summary of the chat history." },
              tasks: {
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
            },
            required: ["summary", "tasks"]
          }
        }
      });

      const text = response.text || '{"summary": "No summary available.", "tasks": []}';
      return JSON.parse(text);
    } catch (error) {
      console.error("Recap extraction error:", error);
      return { summary: "Error generating recap.", tasks: [] };
    }
  }
}

export const geminiService = new GeminiService();
