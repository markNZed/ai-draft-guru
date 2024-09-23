// backend/src/routes/template.mjs
import express from 'express';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.mjs';
import { getProcessedTemplate } from '../services/templateService.mjs';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id: requestId } = req;
    const { name } = req.query; // Get the template name from query parameters
    logger.debug('Received /template request', { requestId, name });

    if (!name) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    try {
      const processedTemplate = await getProcessedTemplate(requestId, name); // Pass the template name
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
