const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.API_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.'
});

const generationLimiter = rateLimit({
  windowMs: parseInt(process.env.GENERATION_WINDOW_MS || '86400000', 10),
  max: parseInt(process.env.GENERATION_MAX_REQUESTS || '10', 10),
  message: 'Daily generation limit reached. Please try again tomorrow.'
});

module.exports = { apiLimiter, generationLimiter };
