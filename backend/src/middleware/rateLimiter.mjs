// backend/middleware/rateLimiter.mjs

import rateLimit from 'express-rate-limit';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { requestId: req.id, ip: req.ip });
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  },
});
