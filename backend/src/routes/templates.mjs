// backend/src/routes/templates.mjs

import express from 'express';
import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs/promises';
import logger from '../config/logger.mjs';

const router = express.Router();

// Define the templates directory path
const templatesDir = path.join(path.resolve(), 'templates');

/**
 * GET /templates
 * Returns a list of available template names.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { id: requestId } = req;
    logger.debug('Received /templates request', { requestId });

    try {
      // Read all files in the templates directory
      const files = await fs.readdir(templatesDir);

      // Filter out non-.md files and remove the extension
      const templates = files
        .filter((file) => path.extname(file).toLowerCase() === '.md')
        .map((file) => path.basename(file, '.md'));

      res.json({ templates });
    } catch (error) {
      logger.error('Error reading templates directory', {
        requestId,
        error: error.message,
      });
      res.status(500).json({ message: 'Failed to retrieve templates.' });
    }
  })
);

export default router;
