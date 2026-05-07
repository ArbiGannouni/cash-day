import { GoogleGenerativeAI } from "@google/generative-ai";
import Constants from 'expo-constants';

/**
 * AI Service - Handles all Gemini AI interactions directly from the client.
 * Securely retrieves the API key from Expo constants.
 */

// Retrieve the API key from app.json / Constants
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;

if (!GEMINI_API_KEY) {
  console.warn("AI Service: GEMINI_API_KEY is missing in Expo Constants!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const aiService = {
  /**
   * Processes Tunisian Darija audio to extract financial data.
   * @param {string} audioBase64 - The base64 encoded audio data.
   */
  processVoice: async (audioBase64) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `Task: Extract financial data from Tunisian Darija audio.
      Format: Return ONLY a JSON object. No extra text, no conversation.
      
      JSON Structure:
      {
        "transcription": "text in darija",
        "amount": number,
        "category": "Food" | "Transport" | "Rent" | "Health" | "Shopping" | "Others",
        "description": "short description",
        "confidence": 0.0 to 1.0,
        "tags": ["tag1", "tag2"],
        "paymentMethod": "Cash" | "Card" | "Transfer"
      }`;

      const result = await model.generateContent([
        systemPrompt,
        { inlineData: { data: audioBase64, mimeType: "audio/m4a" } }
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      console.error("AI Service Error: Invalid JSON response", text);
      throw new Error("AI returned text instead of data.");
    } catch (error) {
      console.error("AI Service: ProcessVoice failed", error);
      throw error;
    }
  },

  /**
   * Analyzes receipt images using OCR and AI.
   * @param {string} imageBase64 - The base64 encoded image data.
   */
  processReceipt: async (imageBase64) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are an expert receipt analyzer. Extract the following from the receipt image:
      - total amount (number only)
      - category (Food, Transport, Rent, Health, Shopping, Others)
      - store name or description
      
      Return ONLY JSON:
      {"amount": number, "category": "CategoryName", "description": "Store Name"}`;

      const result = await model.generateContent([
        systemPrompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);

      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("AI Service: Failed to parse receipt");
    } catch (error) {
      console.error("AI Service: ProcessReceipt failed", error);
      throw error;
    }
  },

  /**
   * Generates a budget alert message based on user spending.
   */
  getBudgetAlert: async (data) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a budget alert assistant. Generate a friendly notification message for overspending.
      Return ONLY JSON: { "title": string, "body": string, "tip": string, "severity": "warning"|"danger" }`;

      const userPrompt = `Category: ${data.category}, Budget: ${data.budget}, Spent: ${data.spent}, Lang: ${data.language || 'English'}`;

      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("AI Service: Failed to generate alert");
    } catch (error) {
      console.error("AI Service: BudgetAlert failed", error);
      throw error;
    }
  },

  /**
   * Provides deep financial insights based on monthly reports.
   */
  getAiInsights: async (reportData) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a financial trend analyst. Analyze spending trends.
      Return ONLY JSON:
      {
        "overall_trend": "improving"|"worsening"|"stable",
        "trend_percentage": number,
        "category_changes": [],
        "biggest_increase": { "category": string, "amount": number },
        "recommendation": string
      }`;

      const userPrompt = `Analysis for: ${reportData.month}, Total: ${reportData.totalSpent}, Last: ${reportData.lastMonthTotal}`;

      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("AI Service: Failed to generate insights");
    } catch (error) {
      console.error("AI Service: Insights failed", error);
      throw error;
    }
  }
};
