
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData, ChatMessage, ThemePreset, PersonaResult } from "../types";

// Helper for exponential backoff retries
const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED";
    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const getBase64Parts = (imageData: string) => {
  const mimeTypeMatch = imageData.match(/^data:(.*);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const base64Data = imageData.split(',')[1];
  return { mimeType, base64Data };
};

export const classifyPersona = async (imageData: string): Promise<PersonaResult> => {
  return retry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { mimeType, base64Data } = getBase64Parts(imageData);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Identify the candidate's career persona, professional title, and a witty 1-sentence 'spicy roast' of their resume." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            persona: { type: Type.STRING },
            title: { type: Type.STRING },
            roast: { type: Type.STRING }
          },
          required: ["persona", "title", "roast"]
        }
      }
    });

    return JSON.parse(response.text) as PersonaResult;
  });
};

export const parseResume = async (imageData: string): Promise<ResumeData> => {
  return retry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { mimeType, base64Data } = getBase64Parts(imageData);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Extract resume data into the provided JSON schema. Preserve all details." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            contact: {
              type: Type.OBJECT,
              properties: {
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING },
              },
              required: ["email"],
            },
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  company: { type: Type.STRING },
                  position: { type: Type.STRING },
                  period: { type: Type.STRING },
                  description: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING },
                },
              },
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["name", "title", "contact", "summary"],
        }
      }
    });

    return JSON.parse(response.text) as ResumeData;
  });
};

export const generateDynamicThemes = async (persona: string, title: string): Promise<ThemePreset[]> => {
  return retry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Persona: "${persona}", Title: "${title}". Generate 3 distinct themes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              fontFamily: { type: Type.STRING },
              headingFont: { type: Type.STRING },
              style: { type: Type.STRING },
              type: { type: Type.STRING },
            },
            required: ["name", "description", "accentColor", "secondaryColor", "fontFamily", "headingFont", "style", "type"],
          },
        },
      },
    });
    return JSON.parse(response.text || '[]').map((t: any, i: number) => ({ ...t, id: `dynamic-theme-${i}` }));
  });
};

export const generateAuraBackground = async (theme: ThemePreset, persona: string): Promise<string | null> => {
  const tryGenerate = async (model: string, size?: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const config: any = { imageConfig: { aspectRatio: "16:9" } };
    if (size) config.imageConfig.imageSize = size;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: `Professional abstract texture for a portfolio background. Style: ${theme.style}. Vibe: ${theme.type}. Persona: ${persona}. 4k resolution.` }]
      },
      config
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  };

  try {
    // Attempt Pro Image generation first
    return await retry(() => tryGenerate('gemini-3-pro-image-preview', '1K'));
  } catch (err: any) {
    const errorMsg = err.message || '';
    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429") || errorMsg.includes("Requested entity was not found")) {
        console.warn("Pro Image generation failed, falling back to Flash Image...");
        try {
            // Fallback to Flash Image model which usually has higher limits
            return await retry(() => tryGenerate('gemini-2.5-flash-image'));
        } catch (innerErr) {
            console.error("Flash fallback failed:", innerErr);
            throw err; // Escalate to trigger key selection
        }
    }
    throw err;
  }
};

export const generateCustomAura = async (userPrompt: string, persona: string): Promise<ThemePreset> => {
  return retry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Custom theme prompt: "${userPrompt}". Persona: "${persona}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            fontFamily: { type: Type.STRING },
            headingFont: { type: Type.STRING },
            style: { type: Type.STRING },
          },
          required: ["name", "description", "accentColor", "secondaryColor", "fontFamily", "headingFont", "style"],
        },
      },
    });
    return { ...JSON.parse(response.text), id: 'custom-aura', type: 'custom' };
  });
};

export const refineResumeWithChat = async (currentData: ResumeData, prompt: string, history: ChatMessage[]): Promise<string> => {
  return retry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const historyContext = history.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');

    const systemInstruction = `
      You are AURA, an elite Career Strategist and Technical Recruiter.
      Your Goal: Maximize hireability by forcing specificity and metrics.

      CORE BEHAVIORS:
      1. **Be High-Agency:** Audit the JSON. If dates are missing, bullet points are weak, or skills are generic, CALL IT OUT.
      2. **The "XYZ" Formula:** "Accomplished [X] as measured by [Y], by doing [Z]." 
         If they provide a weak answer, interrogate them for numbers.
      3. **Live State Updates:** If proposing a content change, YOU MUST provide a JSON block inside triple backticks at the end of your response. 
      4. **Tone:** Professional, Direct, Slightly Critical. No "I hope this helps."

      FORMATTING PROTOCOLS:
      1. **No Walls of Text:** Use short paragraphs (max 2 sentences).
      2. **Markdown:** Bold key metrics/skills. Use Bullet points.
      3. **Action Cards:** Use dividers "---" if separating a critique from a proposal.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        System: ${systemInstruction}
        Resume Data: ${JSON.stringify(currentData)}
        History:
        ${historyContext}
        User Message: ${prompt}
      `,
      config: {
        systemInstruction: "You are an elite career concierge. Return JSON patches in backticks if data changes.",
      }
    });

    return response.text || "I'm having trouble analyzing that. Can you rephrase?";
  });
};
