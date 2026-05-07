import { GoogleGenerativeAI } from "@google/generative-ai";

// REPLACE WITH YOUR ACTUAL GEMINI API KEY
const GEMINI_API_KEY = "AIzaSyCMgCP3wwS6y13pmeLE9V6V4kFGBu-Xgzc";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const aiService = {
  processVoice: async (audioBase64) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `أنت مساعد مالي تونسي خبير في فهم الدارجة التونسية (Darija). 
      مهمتك هي تحليل الملاحظات الصوتية واستخراج البيانات المالية بدقة.
      
      يجب أن يكون الرد بصيغة JSON فقط:
      {
        "transcription": "النص المسموع بالدارجة",
        "amount": الرقم فقط بالدينار,
        "category": "Food" | "Transport" | "Rent" | "Health" | "Shopping" | "Others",
        "description": "وصف قصير ومختصر بالدارجة التونسية (مثلاً: قضية من العطار، خلاص ضو، إلخ)",
        "confidence": نسبة ثقتك في التصنيف بين 0 و 1,
        "tags": ["أوسمة", "قصيرة"],
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
      throw new Error("AI failed to parse response");
    } catch (error) {
      console.error("Client AI Error:", error);
      throw error;
    }
  },

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
      throw new Error("AI failed to parse receipt");
    } catch (error) {
      console.error("Receipt AI Error:", error);
      throw error;
    }
  },

  getBudgetAlert: async (data) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a budget alert assistant. When a user exceeds their budget in a category, generate a friendly, non-alarming notification message.

      RULES:
      - Keep the message under 2 sentences
      - Be encouraging, not scolding
      - Include the overspent amount
      - Suggest one quick action they can take
      - Support Arabic, French, and English based on user language preference

      Return ONLY JSON: { "title": string, "body": string, "tip": string, "severity": "warning"|"danger" }`;

      const userPrompt = `Category: ${data.category}
      Budget limit: ${data.budget} TND
      Amount spent: ${data.spent} TND
      Percentage used: ${data.percentage}%
      User language preference: ${data.language || 'English'}`;

      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("AI failed to generate alert");
    } catch (error) {
      console.error("Budget Alert AI Error:", error);
      throw error;
    }
  },

  getAiInsights: async (reportData) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a financial trend analyst. Analyze spending across months and categories.
      Return ONLY JSON:
      {
        "overall_trend": "improving"|"worsening"|"stable",
        "trend_percentage": number,
        "category_changes": [
          { "category": string, "change_percent": number, "direction": "up"|"down"|"same" }
        ],
        "biggest_increase": { "category": string, "amount": number, "reason_guess": string },
        "biggest_decrease": { "category": string, "amount": number },
        "next_month_forecast": number,
        "recommendation": string
      }`;

      const userPrompt = `Analysis for: ${reportData.month}
      Total Spent: ${reportData.totalSpent} TND
      Last Month Total: ${reportData.lastMonthTotal} TND
      Category Breakdown: ${JSON.stringify(reportData.categories)}
      Currency: TND. Provide analysis in English.`;

      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("AI failed to generate insights");
    } catch (error) {
      console.error("Insights AI Error:", error);
      throw error;
    }
  }
};
