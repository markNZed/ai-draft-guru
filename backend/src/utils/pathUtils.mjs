// backend/src/utils/pathUtils.mjs

import path from 'path';
import sanitize from 'sanitize-filename';
import fs from 'fs/promises';

/**
 * Base directory for projects
 */
export const projectsBaseDir = path.join(path.resolve(), 'projects');

/**
 * Utility to sanitize and validate project name
 */
export const getSanitizedProjectName = (name) => {
  const sanitized = sanitize(name);
  const PROJECT_NAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/; // Adjust as needed
  if (!PROJECT_NAME_REGEX.test(sanitized)) {
    throw new Error('Project name contains invalid characters or length.');
  }
  return sanitized;
};

/**
 * Utility to sanitize and validate file name
 */
export const getSanitizedFileName = (name) => {
  let sanitized = sanitize(name);

  // Check if the file name already ends with .md, if not, add the extension
  if (!sanitized.endsWith('.md')) {
    sanitized += `.md`;
  }

  const FILE_NAME_REGEX = /^[a-zA-Z0-9_\- ]{1,100}\.md$/; // Adjust as needed
  if (!FILE_NAME_REGEX.test(sanitized)) {
    throw new Error('File name contains invalid characters, format, or length.');
  }

  return sanitized;
};

/**
 * Securely get the absolute file path within a project.
 * Prevents path traversal by ensuring the resolved path starts with the project directory.
 */
export const getFilePath = (projectName, fileName = '') => {
  const sanitizedProjectName = getSanitizedProjectName(projectName);
  const projectDir = path.resolve(projectsBaseDir, sanitizedProjectName);

  let filePath;
  if (fileName) {
    const sanitizedFileName = getSanitizedFileName(fileName);
    filePath = path.normalize(path.join(projectDir, sanitizedFileName));
  } else {
    filePath = projectDir;
  }

  if (!filePath.startsWith(projectDir)) {
    throw new Error('Invalid file path.');
  }

  return filePath;
};
