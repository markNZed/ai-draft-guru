// backend/src/routes/project.mjs

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';
import applyCommandRouter from './applyCommand.mjs'; // Ensure it's correctly imported

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
 * Create a new project
 */
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Project name is required'),
  ],
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on creating project', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = uuidv4();
    const projectPath = getProjectPath(projectId);

    try {
      await fs.mkdir(projectPath, { recursive: true });
      // Initialize with a README.md
      const readmePath = path.join(projectPath, 'README.md');
      await fs.writeFile(readmePath, `# ${name}\n\nProject initialized.`);
      logger.info('Project created', { projectId, name });
      res.status(201).json({ projectId, name });
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
          projectId: dirent.name,
          name: dirent.name, // Alternatively, read from a config file or README
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
  '/:projectId/files',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('name').isString().notEmpty().withMessage('File name is required'),
  ],
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on creating file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const projectPath = getProjectPath(projectId);
    try {
      // Check if project exists
      await fs.access(projectPath);
    } catch (error) {
      logger.warn('Project not found', { projectId });
      return res.status(404).json({ message: 'Project not found.' });
    }

    const fileId = uuidv4();
    const filePath = getFilePath(projectId, fileId);

    try {
      await fs.writeFile(filePath, `# ${name}\n\nNew document.`);
      logger.info('File created', { projectId, fileId, name });
      res.status(201).json({ fileId, name });
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
  '/:projectId/files/:fileId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    param('fileId').isUUID().withMessage('Invalid file ID'),
  ],
  asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on deleting file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const filePath = getFilePath(projectId, fileId);

    try {
      await fs.unlink(filePath);
      logger.info('File deleted', { projectId, fileId });
      res.json({ message: 'File deleted successfully.' });
    } catch (error) {
      logger.error('Error deleting file', { error: error.message });
      res.status(500).json({ message: 'Failed to delete file.' });
    }
  })
);

/**
 * Get all files within a project
 */
router.get(
  '/:projectId/files',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
  ],
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on fetching files', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const projectPath = getProjectPath(projectId);
    try {
      // Check if project exists
      await fs.access(projectPath);
    } catch (error) {
      logger.warn('Project not found', { projectId });
      return res.status(404).json({ message: 'Project not found.' });
    }

    try {
      const files = await fs.readdir(projectPath, { withFileTypes: true });
      const fileList = files
        .filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.md')
        .map(dirent => ({
          fileId: path.basename(dirent.name, '.md'),
          name: path.basename(dirent.name, '.md'), // Alternatively, parse the file to get a title
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
  '/:projectId/files/:fileId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    param('fileId').isUUID().withMessage('Invalid file ID'),
  ],
  asyncHandler(async (req, res) => {
    const { projectId, fileId } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors on fetching file', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const filePath = getFilePath(projectId, fileId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ fileId, content });
    } catch (error) {
      logger.error('Error fetching file content', { error: error.message });
      res.status(500).json({ message: 'Failed to fetch file content.' });
    }
  })
);

/**
 * Apply a command to all files within a project
 */
router.post(
    '/:projectId/apply-command',
    [
      param('projectId').isUUID().withMessage('Invalid project ID'),
      body('command').isString().notEmpty().withMessage('Command is required'),
    ],
    asyncHandler(async (req, res) => {
      const { projectId } = req.params;
      const { command } = req.body;
      const { id: requestId } = req;
  
      logger.debug('Received bulk /apply-command request', {
        requestId,
        projectId,
        command,
      });
  
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors on bulk apply-command', { errors: errors.array() });
        return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
      }
  
      const projectPath = getProjectPath(projectId);
      try {
        // Check if project exists
        await fs.access(projectPath);
      } catch (error) {
        logger.warn('Project not found', { projectId });
        return res.status(404).json({ message: 'Project not found.' });
      }
  
      try {
        const files = await fs.readdir(projectPath, { withFileTypes: true });
        const markdownFiles = files.filter(dirent => dirent.isFile() && path.extname(dirent.name) === '.md');
  
        if (markdownFiles.length === 0) {
          return res.status(400).json({ message: 'No markdown files found in the project.' });
        }
  
        // Process each file
        const results = await Promise.all(markdownFiles.map(async (file) => {
          const fileId = path.basename(file.name, '.md');
          const filePath = getFilePath(projectId, fileId);
          let content = await fs.readFile(filePath, 'utf-8');
  
          // Prepare a mock request object for applyCommandRouter
          const mockReq = {
            params: { projectId, fileId },
            body: { command, documentContent: content, type: 'bulk' }, // 'type' can be used to differentiate
            id: requestId,
          };
          const mockRes = {
            status: (code) => {
              mockRes.statusCode = code;
              return mockRes;
            },
            json: (data) => {
              mockRes.body = data;
              return mockRes;
            },
            send: (data) => {
              mockRes.body = data;
              return mockRes;
            },
            set: jest.fn(),
          };
  
          // Invoke the applyCommandRouter's handler directly
          await applyCommandRouter.handle(mockReq, mockRes, () => {});
  
          return {
            fileId,
            status: mockRes.statusCode,
            data: mockRes.body,
          };
        }));
  
        res.json({ results });
      } catch (error) {
        logger.error('Error applying command to all files', { requestId, error: error.message });
        res.status(500).json({ message: 'Failed to apply command to all files.' });
      }
    })
  );
  
  export default router;