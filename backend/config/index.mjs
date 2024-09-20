// backend/config/index.mjs

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: ['http://localhost:8080', 'https://gptengineer.app'],
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute',
  },
  openAiApiKey: process.env.OPENAI_API_KEY,
};
