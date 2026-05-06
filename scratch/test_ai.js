const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../backend/.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAI() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say 'AI is working' if you can read this.");
    console.log(result.response.text());
  } catch (err) {
    console.error('AI Test Failed:', err);
  }
}

testAI();
