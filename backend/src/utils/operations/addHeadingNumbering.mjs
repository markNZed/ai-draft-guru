// backend/utils/operations/addHeadingNumbering.mjs

import { visit } from 'unist-util-visit';
import logger from '../../config/logger.mjs';

/**
 * Adds numbering to all headings in the document based on their depth.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters (currently unused).
 * @param {string} requestId - Unique identifier for the request.
 */
export const addHeadingNumbering = (tree, parameters, requestId) => {
  logger.debug('Adding numbering to headings.', { requestId });
  const headingCounters = {};

  visit(tree, 'heading', (node) => {
    const depth = node.depth;
    headingCounters[depth] = (headingCounters[depth] || 0) + 1;

    // Reset counters for deeper levels
    for (let d = depth + 1; d <= 6; d++) {
      headingCounters[d] = 0;
    }

    const numbering = Array.from({ length: depth }, (_, i) => headingCounters[i + 1]).join('.');
    const textNode = node.children.find((child) => child.type === 'text');

    if (textNode && !textNode.value.startsWith(`${numbering} `)) {
      logger.debug(`Adding numbering to heading: ${textNode.value}`, { requestId });
      textNode.value = `${numbering} ${textNode.value}`;
    }
  });
};
