// backend/utils/operations/generateToc.mjs

import { unified } from 'unified';
import remarkToc from 'remark-toc';
import logger from '../../config/logger.mjs';

/**
 * Generates a Table of Contents for the document.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters (currently unused).
 * @param {string} requestId - Unique identifier for the request.
 */
export const generateToc = (tree, parameters, requestId) => {
  logger.debug('Generating Table of Contents.', { requestId });
  try {
    unified()
      .use(remarkToc, { tight: true }) // Customize TOC options if needed
      .runSync(tree); // Process the tree and generate the TOC
    logger.debug('TOC generated and applied to AST', { requestId });
  } catch (error) {
    logger.error('Error generating TOC', { requestId, error: error.message });
    throw error;
  }
};
