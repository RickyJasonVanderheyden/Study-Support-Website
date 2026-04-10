const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in .env file. AI features will be disabled.');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const model = genAI ? genAI.getGenerativeModel({ model: modelName }) : null;

if (model) {
  console.log('✅ GEMINI_API_KEY loaded (key exists)');
  console.log(`🤖 Gemini model: ${modelName}`);
}

module.exports = model;
