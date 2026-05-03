const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Income = require('../models/Income');

// --- Incomes ---
router.get('/incomes', async (req, res) => {
  try {
    const incomes = await Income.find().sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/incomes', async (req, res) => {
  try {
    const income = new Income(req.body);
    await income.save();
    res.status(201).json(income);
  } catch (err) {
    console.error('Income Save Error:', err);
    res.status(400).json({ message: err.message });
  }
});

router.delete('/incomes/:id', async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: 'Income deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/incomes/:id', async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(income);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (err) {
    console.error('Expense Update Error:', err);
    res.status(400).json({ message: err.message });
  }
});
const Settings = require('../models/Settings');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- AI Voice Processing ---
router.post('/ai/process-voice', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ message: 'No audio data provided' });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const systemPrompt = `أنت مساعد مالي تونسي خبير في فهم الدارجة التونسية (Darija). 
    مهمتك هي تحليل الملاحظات الصوتية واستخراج البيانات المالية بدقة.
    
    يجب أن يكون الرد بصيغة JSON فقط:
    {
      "transcription": "النص المسموع بالدارجة",
      "amount": الرقم فقط بالدينار,
      "category": "Food" | "Transport" | "Rent" | "Health" | "Shopping" | "Others",
      "description": "وصف قصير",
      "confidence": نسبة ثقتك في التصنيف بين 0 و 1,
      "tags": ["قائمة", "أوسمة", "قصيرة"],
      "paymentMethod": "Cash" | "Card" | "Transfer"
    }`;

    const result = await model.generateContent([
      systemPrompt,
      { inlineData: { data: audioBase64, mimeType: "audio/mp4" } }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ message: 'AI failed to parse the response' });
    }
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ message: 'Error processing AI request' });
  }
});

router.post('/ai/process-receipt', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ message: 'No image data provided' });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ message: 'AI failed to parse the receipt' });
    }
  } catch (err) {
    console.error('Receipt AI Error:', err);
    res.status(500).json({ message: 'Error processing receipt' });
  }
});

router.post('/ai/budget-alert', async (req, res) => {
  try {
    const { category, budget, spent, percentage, language } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const systemPrompt = `You are a budget alert assistant. When a user exceeds their budget in a category, generate a friendly, non-alarming notification message.

    RULES:
    - Keep the message under 2 sentences
    - Be encouraging, not scolding
    - Include the overspent amount
    - Suggest one quick action they can take
    - Support Arabic, French, and English based on user language preference

    Return ONLY JSON: { "title": string, "body": string, "tip": string, "severity": "warning"|"danger" }`;

    const userPrompt = `Category: ${category}
    Budget limit: ${budget} TND
    Amount spent: ${spent} TND
    Percentage used: ${percentage}%
    User language preference: ${language || 'English'}`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.status(500).json({ message: 'AI failed to generate alert' });
    }
  } catch (err) {
    console.error('Budget Alert AI Error:', err);
    res.status(500).json({ message: 'Error generating alert' });
  }
});
router.get('/stats/report', async (req, res) => {
  try {
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7);
    const start = new Date(selectedMonth + "-01");
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1));

    // Current Month Stats
    const currentStats = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $count: {} } } }
    ]);

    // Last Month Stats
    const lastMonthStart = new Date(new Date(start).setMonth(start.getMonth() - 1));
    const lastMonthEnd = start;
    const lastStats = await Expense.aggregate([
      { $match: { date: { $gte: lastMonthStart, $lt: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Category Breakdown
    const catStats = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);
    await Category.populate(catStats, { path: '_id' });

    res.json({
      month: selectedMonth,
      totalSpent: currentStats[0]?.total || 0,
      count: currentStats[0]?.count || 0,
      lastMonthTotal: lastStats[0]?.total || 0,
      categories: catStats.map(c => ({
        name: c._id?.name || 'Unknown',
        total: c.total,
        color: c._id?.color || '#868e96'
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

let insightsCache = null;
let lastCacheUpdate = null;

router.get('/ai/insights', async (req, res) => {
  try {
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month YYYY-MM
    
    // Return cached insights if valid (include month in cache key)
    const cacheKey = `insights_${selectedMonth}`;
    if (insightsCache && insightsCache[cacheKey] && lastCacheUpdate && (Date.now() - lastCacheUpdate < 15 * 60 * 1000)) {
      return res.json(insightsCache[cacheKey]);
    }

    const monthlyStats = await Expense.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalSpent: { $sum: "$amount" }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Filter category stats for the selected month
    const start = new Date(selectedMonth + "-01");
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1));

    const categoryStats = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" }
        }
      }
    ]);
    await Category.populate(categoryStats, { path: '_id' });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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

    const userPrompt = `Monthly Totals: ${JSON.stringify(monthlyStats)}
    Category Breakdown: ${JSON.stringify(categoryStats)}
    Currency: TND. Provide analysis in English.`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const resultJson = JSON.parse(jsonMatch[0]);
      if (!insightsCache) insightsCache = {};
      insightsCache[cacheKey] = resultJson;
      lastCacheUpdate = Date.now();
      res.json(resultJson);
    } else {
      res.status(500).json({ message: 'AI failed to generate insights' });
    }
  } catch (err) {
    console.error('Insights AI Error:', err);
    
    // Fallback: Provide a basic calculation if AI fails (e.g. 429 error)
    try {
      const monthlyStats = await Expense.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, totalSpent: { $sum: "$amount" } } },
        { $sort: { _id: -1 } }
      ]);

      const currentMonth = monthlyStats[0]?.totalSpent || 0;
      const lastMonth = monthlyStats[1]?.totalSpent || 1; // avoid div by zero
      const trendPercent = ((currentMonth - lastMonth) / lastMonth) * 100;

      res.json({
        overall_trend: trendPercent <= 0 ? "improving" : "worsening",
        trend_percentage: trendPercent,
        category_changes: [],
        biggest_increase: { category: "N/A", amount: 0, reason_guess: "Analysis busy" },
        biggest_decrease: { category: "N/A", amount: 0 },
        next_month_forecast: currentMonth,
        recommendation: "AI analysis is currently busy. Based on raw numbers, you are spending " + (trendPercent <= 0 ? "less" : "more") + " than last month. Keep tracking!"
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Error generating insights' });
    }
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().populate('categoryId').sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error('Get Expenses Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = new Expense({
      amount: req.body.amount,
      categoryId: req.body.categoryId,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type
    });
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    console.error('Create Expense Error:', err);
    res.status(400).json({ message: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const result = await Expense.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete Expense Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Categories ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Settings ---
router.get('/settings/:key', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    res.json(setting || { key: req.params.key, value: '' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Stats (Aggregation) ---
router.get('/stats/monthly', async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          totalSpent: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/stats/category', async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $sort: { total: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Debug / System ---
router.post('/debug/reset', async (req, res) => {
  try {
    await Expense.deleteMany({});
    await Income.deleteMany({});
    await Settings.findOneAndUpdate(
      { key: 'monthly_salary' },
      { value: '0' },
      { upsert: true }
    );
    res.json({ message: 'Hard reset complete. All data cleared.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
