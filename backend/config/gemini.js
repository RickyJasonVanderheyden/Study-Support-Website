const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ CRITICAL: GEMINI_API_KEY is not set in .env file!');
  throw new Error('GEMINI_API_KEY is required');
}

console.log('✅ GEMINI_API_KEY loaded (key exists)');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const model = genAI.getGenerativeModel({ model: modelName });
console.log(`🤖 Gemini model: ${modelName}`);

module.exports = model;
