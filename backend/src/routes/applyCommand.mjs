// backend/src/routes/applyCommand.mjs

import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.mjs';
import { applyCommandToFile } from '../services/commandService.mjs'; // Import the service function
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Base directory for projects
const projectsBaseDir = path.join(path.resolve(), 'projects');

/**
 * Utility to get project path
 */
const getProjectPath = (projectId) => path.join(projectsBaseDir, projectId);

/**
 * Utility to get file path within a project
 */
const getFilePath = (projectId, fileId) => path.join(getProjectPath(projectId), `${fileId}.md`);

/**
 * Apply command to a specific file
 */
router.post(
  '/:projectId/:fileId',
  [
    body('command').isString().notEmpty(),
    body('type').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;
    const { command, type } = req.body;
    const { id: requestId } = req;

    logger.debug('Received /apply-command request', {
      requestId,
      projectId,
      fileId,
      command,
      type,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { requestId, errors: errors.array() });
      return res
        .status(400)
        .json({ message: 'Invalid input.', errors: errors.array() });
    }

    try {
      const result = await applyCommandToFile(projectId, fileId, command, type || 'single', requestId);
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

export default router;
