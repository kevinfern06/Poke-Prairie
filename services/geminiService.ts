import { GoogleGenAI, Type } from "@google/genai";
import { Pokemon, Recommendation } from "../types";

// Helper to get clean text from a pokemon team for context
const getTeamContext = (team: Pokemon[]) => {
  if (team.length === 0) return "L'utilisateur n'a pas encore de Pokémon.";
  
  const teamDesc = team.map(p => {
    const types = p.types.map(t => t.type.name).join('/');
    const stats = p.stats.map(s => `${s.stat.name}:${s.base_stat}`).join(', ');
    return `- ${p.name.toUpperCase()} (Nom FR: ${p.localizedName}) (${types}) [Stats: ${stats}]`;
  }).join('\n');
  
  return `Équipe actuelle:\n${teamDesc}`;
};

export const createChatSession = (apiKey: string, team: Pokemon[]) => {
  const ai = new GoogleGenAI({ apiKey });
  
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are an elite Pokémon VGC (Video Game Championships) and competitive battling coach. 
      Your goal is to help the user build a balanced, synergistic team.
      
      ${getTeamContext(team)}
      
      Analyze their team for:
      1. Type coverage gaps (offensive and defensive).
      2. Role compression (sweepers, walls, support).
      3. Synergy between members.
      
      Be concise, encouraging, and use terminology like "STAB", "pivot", "check", and "counter" where appropriate but explain them simply.
      If the team is empty, suggest a good starting core (e.g., Fire/Water/Grass core).
      `,
    }
  });
};

export const editTeamImage = async (apiKey: string, base64Image: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    // Clean base64 string if it contains headers
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for simplicity, though the API handles standard types
              data: cleanBase64
            }
          },
          {
            text: `Edit this image based on the following instruction: ${prompt}. Maintain the core composition but apply the requested style or changes.`
          }
        ]
      }
    });

    // Extract image from response parts
    // The response might contain an image in inlineData
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Fallback if only text is returned (unexpected for image model but possible)
    return null;
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};

export const generateTeamRecommendations = async (apiKey: string, team: Pokemon[]): Promise<Recommendation[]> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the following team, suggest 3 Pokémon to add. 
    Consider type balance (covering weaknesses) and the "style" of the team (e.g. if they are all cute, suggest cute ones; if competitive, suggest meta counters).
    
    ${getTeamContext(team)}
    
    Provide the response in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'The English name of the Pokemon (for API lookup, lowercase)',
            },
            frenchName: {
              type: Type.STRING,
              description: 'The French name of the Pokemon',
            },
            reason: {
              type: Type.STRING,
              description: 'A short explanation in French why this fits the team (covers X weakness, provides support, etc)',
            },
          },
          required: ["name", "frenchName", "reason"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  
  try {
    return JSON.parse(text) as Recommendation[];
  } catch (e) {
    console.error("Failed to parse recommendation JSON", e);
    return [];
  }
};
