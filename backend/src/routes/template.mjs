// backend/routes/template.mjs

import express from 'express';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.mjs';
import { getProcessedTemplate } from '../services/templateService.mjs';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id: requestId } = req;
    logger.debug('Received /template request', { requestId });

    try {
      const processedTemplate = await getProcessedTemplate(requestId);
      res.setHeader('Content-Type', 'text/markdown');
      res.send(processedTemplate);
    } catch (error) {
      logger.error('Error in /template route', {
        requestId,
        error: error.message,
      });
      res.status(500).json({ message: 'Failed to retrieve template.' });
    }
  })
);

export default router;
