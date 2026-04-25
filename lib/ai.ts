import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

export const QUZ_GEN_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The full text of the question" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Exactly 4 multiple choice options"
      },
      correctAnswerIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct answer" },
      explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct" },
      difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"], description: "The conceptual difficulty of the question" }
    },
    required: ["text", "options", "correctAnswerIndex", "explanation", "difficulty"]
  }
};

export async function generateAIQuestions(subject: string, topic: string, count: number = 5) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} professional and challenging BBA-level multiple choice questions for the subject "${subject}" specifically on the topic "${topic}". Include detailed BBA-relevant explanations.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: QUZ_GEN_SCHEMA,
      }
    });

    if (!response.text) {
      throw new Error("AI did not return any text content");
    }

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}
