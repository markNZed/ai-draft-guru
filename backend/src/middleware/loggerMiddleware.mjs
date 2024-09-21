// backend/middleware/loggerMiddleware.mjs

import expressWinston from 'express-winston';
import logger from '../config/logger.mjs';

export const loggerMiddleware = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: false,
  colorize: false,
  ignoreRoute: () => false,
  dynamicMeta: (req, res) => ({
    requestId: req.id,
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  }),
});
