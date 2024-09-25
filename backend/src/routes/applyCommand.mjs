// backend/src/routes/applyCommand.mjs

import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.mjs';
import { applyCommand } from '../services/commandService.mjs'; // Import the service function
import { getFilePath, getSanitizedProjectName, getSanitizedFileName } from '../utils/pathUtils.mjs';

const router = express.Router();

/**
 * Apply command to a specific file
 */
router.post(
  '/:projectName/:fileName', // Updated route path for clarity
  [
    body('command')
      .isString()
      .notEmpty()
      .withMessage('Command must be a non-empty string.'),
    body('type')
      .optional()
      .isString()
      .withMessage('Type must be a string if provided.'),
  ],
  asyncHandler(async (req, res) => {
    const { projectName, fileName } = req.params;
    const { command, type, content } = req.body;
    const { id: requestId } = req;

    logger.debug('Received /apply-command request', {
      requestId,
      projectName,
      fileName,
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
      // Apply the command using the service function
      const sanitizedProjectName = getSanitizedProjectName(projectName);
      const sanitizedFileName = getSanitizedFileName(fileName);
      const result = await applyCommand(sanitizedProjectName, sanitizedFileName, command, type, content, requestId);

      // Handle MP3 conversion
      if (result.data.specialResults.mp3Buffer) {
        // Set headers and send the MP3 file as a download
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="document.mp3"',
          'Content-Length': result.data.specialResults.mp3Buffer.length,
        });
        logger.debug('Sending MP3 file in response', { requestId });
        return res.send(result.data.specialResults.mp3Buffer);
      }

      // Handle DOCX conversion if applicable
      if (result.data.specialResults.docxBuffer) {
        // Set headers and send the DOCX file as a download
        res.set({
          'Content-Type': 'application/msword',
          'Content-Disposition': 'attachment; filename="document.docx"',
          'Content-Length': result.data.specialResults.docxBuffer.length,
        });
        logger.debug('Sending DOCX file in response', { requestId });
        return res.send(result.data.specialResults.docxBuffer);
      }
    
      res.json(result.data);
    } catch (error) {
      logger.error('Error applying command to file', {
        requestId,
        projectName,
        fileName,
        error: error.message,
      });

      // Differentiate error types for more informative responses
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'File not found.' });
      }

      res.status(500).json({ message: error.message || 'Failed to apply command.' });
    }
  })
);

export default router;
