// backend/middleware/cors.mjs

import cors from 'cors';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (!config.allowedOrigins.includes(origin)) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      logger.warn(`CORS rejection for Origin: ${origin}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});
