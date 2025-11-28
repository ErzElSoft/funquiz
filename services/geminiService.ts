import { GoogleGenAI, Type, Schema } from "@google/genai";

// Helper interface for raw AI response
export interface AIQuizResponse {
  title: string;
  questions: {
    type: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    timeLimitSeconds: number;
  }[];
}

const parseJson = (text: string): AIQuizResponse => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    throw new Error("Invalid JSON response from Gemini");
  }
};

export const generateQuizFromTopic = async (topic: string): Promise<AIQuizResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy title for the quiz" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["MULTIPLE_CHOICE", "TRUE_FALSE"] },
            questionText: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 options for MC, 2 for TF (True/False)"
            },
            correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct option" },
            timeLimitSeconds: { type: Type.INTEGER, description: "Recommended time (10-30s)" }
          },
          required: ["type", "questionText", "options", "correctOptionIndex", "timeLimitSeconds"]
        }
      }
    },
    required: ["title", "questions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a trivia quiz about: "${topic}".
      Generate 5 questions.
      Mix "MULTIPLE_CHOICE" and "TRUE_FALSE" types.
      For TRUE_FALSE, options must be ["True", "False"].
      Ensure one correct answer per question.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return parseJson(text);
  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw error;
  }
};