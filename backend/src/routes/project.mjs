// backend/src/routes/project.mjs

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs/promises';
import sanitize from 'sanitize-filename';
import logger from '../config/logger.mjs';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { applyCommandToFile } from '../services/commandService.mjs';
import { getFilePath, getSanitizedProjectName, getSanitizedFileName } from '../utils/pathUtils.mjs';


// Initialize Express Router
const router = express.Router();

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for projects
const projectsBaseDir = path.join(path.resolve(__dirname, '..', '..'), 'projects');

// Define regex patterns
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/; // Adjust as needed
const FILE_NAME_REGEX = /^[a-zA-Z0-9_\- ]{1,100}\.md$/; // Allow letters, numbers, underscores, hyphens, spaces; 1-100 chars; must end with .md

// Use Helmet for setting secure HTTP headers
router.use(helmet());

/**
 * Save content to a specific file within a project
 */
router.post(
  '/:projectName/files/:fileName/save',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
    param('fileName')
      .isString()
      .withMessage('File name must be a string.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedFileName(value);
        return true;
      }),
    body('content')
      .isString()
      .withMessage('Content must be a string.')
      .custom((value) => {
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { projectName, fileName } = req.params;
    const { content } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on saving file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    let filePath;
    try {
      filePath = getFilePath(projectName, fileName);
    } catch (pathError) {
      logger.warn('Invalid file path', { error: pathError.message });
      return res.status(400).json({ message: 'Invalid file path.' });
    }

    try {
      // Check if file exists
      await fs.access(filePath);
    } catch (error) {
      logger.warn('File not found for saving', { projectName, fileName });
      return res.status(404).json({ message: 'File not found.' });
    }

    try {
      await fs.writeFile(filePath, content, 'utf8');
      logger.info('File saved successfully', { projectName, fileName });
      res.status(200).json({ message: 'File saved successfully.' });
    } catch (error) {
      logger.error('Error saving file', { error: error.message });
      res.status(500).json({ message: 'Failed to save file.' });
    }
  })
);

/**
 * Create a new project
 */
router.post(
  '/',
  [
    body('name')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    let sanitizedName;

    try {
      sanitizedName = getSanitizedProjectName(name);
    } catch (err) {
      logger.warn('Invalid project name', { error: err.message });
      return res.status(400).json({ message: err.message });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on creating project', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const projectPath = getFilePath(sanitizedName);

    try {
      // Check if project already exists
      await fs.access(projectPath);
      logger.warn('Project already exists', { name: sanitizedName });
      return res.status(409).json({ message: 'Project already exists.' });
    } catch (err) {
      // Project does not exist, proceed to create
    }

    try {
      await fs.mkdir(projectPath, { recursive: true, mode: 0o750 });
      // Initialize with a README.md
      const readmePath = path.join(projectPath, 'README.md');
      await fs.writeFile(readmePath, `# ${sanitizedName}\n\nProject initialized.`, { mode: 0o640 });
      logger.info('Project created', { name: sanitizedName });
      res.status(201).json({ name: sanitizedName });
    } catch (error) {
      logger.error('Error creating project', { error: error.message });
      res.status(500).json({ message: 'Failed to create project.' });
    }
  })
);

/**
 * Get all projects
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const projects = await fs.readdir(projectsBaseDir, { withFileTypes: true });
      const projectList = projects
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
          name: dirent.name,
        }));
      res.json({ projects: projectList });
    } catch (error) {
      logger.error('Error fetching projects', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch projects.' });
    }
  })
);

/**
 * Create a new file within a project
 */
router.post(
  '/:projectName/files',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
    body('name')
      .isString()
      .withMessage('File name must be a string.')
      .trim()
      .custom((value) => {
        const sanitized = sanitize(value);
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { projectName } = req.params;
    const { name } = req.body;
    let sanitizedFileName;

    try {
      sanitizedFileName = getSanitizedFileName(name);
    } catch (err) {
      logger.warn('Invalid file name', { error: err.message });
      return res.status(400).json({ message: err.message });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on creating file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const projectPath = getFilePath(projectName);

    try {
      // Check if project exists
      await fs.access(projectPath);
    } catch (error) {
      logger.warn('Project not found', { projectName });
      return res.status(404).json({ message: 'Project not found.' });
    }

    const filePath = getFilePath(projectName, sanitizedFileName);

    try {
      // Check if file already exists
      await fs.access(filePath);
      logger.warn('File already exists', { projectName, fileName: sanitizedFileName });
      return res.status(409).json({ message: 'File already exists.' });
    } catch (err) {
      // File does not exist, proceed to create
    }

    try {
      await fs.writeFile(filePath, `# ${sanitizedFileName.replace('.md', '')}\n\nNew document.`, { mode: 0o640 });
      logger.info('File created', { projectName, name: sanitizedFileName });
      res.status(201).json({ name: sanitizedFileName });
    } catch (error) {
      logger.error('Error creating file', { error: error.message });
      res.status(500).json({ message: 'Failed to create file.' });
    }
  })
);

/**
 * Delete a file within a project
 */
router.delete(
  '/:projectName/files/:fileName',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
    param('fileName')
      .isString()
      .withMessage('File name must be a string.')
      .trim()
      .custom((value) => {
        const sanitized = sanitize(value);
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { projectName, fileName } = req.params;
    let sanitizedFileName;

    try {
      sanitizedFileName = getSanitizedFileName(fileName);
    } catch (err) {
      logger.warn('Invalid file name', { error: err.message });
      return res.status(400).json({ message: err.message });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on deleting file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    let filePath;
    try {
      filePath = getFilePath(projectName, sanitizedFileName);
    } catch (pathError) {
      logger.warn('Invalid file path', { error: pathError.message });
      return res.status(400).json({ message: 'Invalid file path.' });
    }

    try {
      await fs.unlink(filePath);
      logger.info('File deleted', { projectName, fileName: sanitizedFileName });
      res.json({ message: 'File deleted successfully.' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('File not found', { projectName, fileName: sanitizedFileName });
        return res.status(404).json({ message: 'File not found.' });
      }
      logger.error('Error deleting file', { error: error.message });
      res.status(500).json({ message: 'Failed to delete file.' });
    }
  })
);

/**
 * Get all files within a project
 */
router.get(
  '/:projectName/files',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { projectName } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Invalid file name', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    let projectPath;
    try {
      projectPath = getFilePath(projectName);
    } catch (err) {
      logger.warn('Invalid project path', { error: err.message });
      return res.status(400).json({ message: 'Invalid project path.' });
    }

    try {
      // Check if project exists
      await fs.access(projectPath);
    } catch (error) {
      logger.warn('Project not found', { projectName });
      return res.status(404).json({ message: 'Project not found.' });
    }

    try {
      const files = await fs.readdir(projectPath, { withFileTypes: true });
      const fileList = files
        .filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.md')
        .map(dirent => ({
          name: dirent.name
        }));
      res.json({ files: fileList });
    } catch (error) {
      logger.error('Error fetching files', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch files.' });
    }
  })
);

/**
 * Get a specific file's content
 */
router.get(
  '/:projectName/files/:fileName',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
    param('fileName')
      .isString()
      .withMessage('File name must be a string.')
      .trim()
      .custom((value) => {
        const sanitized = sanitize(value);
        return true;
      }),
  ],
  asyncHandler(async (req, res) => {
    const { projectName, fileName } = req.params;
    let sanitizedFileName;

    try {
      sanitizedFileName = getSanitizedFileName(fileName);
    } catch (err) {
      logger.warn('Invalid file name', { error: err.message });
      return res.status(400).json({ message: err.message });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on fetching file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const filePath = getFilePath(projectName, sanitizedFileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ fileName: sanitizedFileName, content });
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('File not found', { projectName, fileName: sanitizedFileName });
        return res.status(404).json({ message: 'File not found.' });
      }
      logger.error('Error fetching file content', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch file content.' });
    }
  })
);

/**
 * Apply command to all files within a project
 */
router.post(
  '/:projectName/apply-command',
  [
    param('projectName')
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Project name must be between 3 and 30 characters.')
      .trim()
      .custom((value) => {
        const sanitized = getSanitizedProjectName(value);
        if (sanitized !== value) {
          throw new Error('Project name contains invalid characters.');
        }
        return true;
      }),
    body('command')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Command is required.'),
    body('type')
      .optional()
      .isString()
      .withMessage('Type must be a string if provided.'),
  ],
  asyncHandler(async (req, res) => {
    const { projectName } = req.params;
    const { command, type } = req.body;
    const { id: requestId } = req;

    logger.debug('Received bulk /apply-command request', {
      requestId,
      projectName,
      command,
      type,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on bulk apply-command', { errors: errors.array() });
      return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
    }

    let projectPath;
    try {
      projectPath = getFilePath(projectName);
    } catch (err) {
      logger.warn('Invalid project path', { error: err.message });
      return res.status(400).json({ message: 'Invalid project path.' });
    }

    try {
      const files = await fs.readdir(projectPath, { withFileTypes: true });
      const markdownFiles = files.filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.md');

      if (markdownFiles.length === 0) {
        return res.status(400).json({ message: 'No markdown files found in the project.' });
      }

      // Process each file concurrently
      const results = await Promise.all(markdownFiles.map(async (file) => {
        const fileName = file.name;

        try {
          const result = await applyCommandToFile(projectName, fileName, command, type, requestId);
          return {
            fileName,
            status: result.status,
            data: result.data,
          };
        } catch (error) {
          logger.error('Error applying command to file', { fileName, error: error.message });
          return {
            fileName,
            status: 500,
            data: { message: error.message },
          };
        }
      }));

      // Optionally, you can summarize the results
      const successCount = results.filter(r => r.status === 200).length;
      const failureCount = results.length - successCount;

      res.json({
        summary: {
          totalFiles: results.length,
          successfulUpdates: successCount,
          failedUpdates: failureCount,
        },
        results,
      });
    } catch (error) {
      logger.error('Error applying command to all files', { requestId, error: error.message });
      res.status(500).json({ message: 'Failed to apply command to all files.' });
    }
  })
);

export default router;