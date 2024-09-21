// backend/server.mjs

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

import logger from './config/logger.mjs';
import { config } from './config/index.mjs';

import { requestIdMiddleware } from './middleware/requestId.mjs';
import { loggerMiddleware } from './middleware/loggerMiddleware.mjs';
import { corsMiddleware } from './middleware/cors.mjs';
import { rateLimiter } from './middleware/rateLimiter.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import applyCommandRouter from './routes/applyCommand.mjs';
import templateRouter from './routes/template.mjs';

import helmet from 'helmet';

// Initialize Express app
const app = express();

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Middleware to assign a unique ID to each request
app.use(requestIdMiddleware);

// HTTP request logging using express-winston
app.use(loggerMiddleware);

// Enable CORS for specific origins
app.use(corsMiddleware);

// Use helmet to set various HTTP headers for security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        // Add more directives as needed
      },
    },
  })
);

// Apply rate limiting to all requests
app.use(rateLimiter);

// Error handling middleware
app.use(errorHandler);

// Parse JSON bodies
app.use(express.json());

// Mount routers
app.use('/apply-command', applyCommandRouter);
app.use('/template', templateRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const { id: requestId } = req;
  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port} NODE_ENV ${config.nodeEnv}`, {
      requestId: 'system',
    });
  });
}

export default app;
