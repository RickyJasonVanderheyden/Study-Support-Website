const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

module.exports = model;
