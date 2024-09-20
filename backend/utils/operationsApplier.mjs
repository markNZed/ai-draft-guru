// backend/utils/operationsApplier.mjs

import logger from '../config/logger.mjs';
import { changeHeading } from './operations/changeHeading.mjs';
import { emphasizeText } from './operations/emphasizeText.mjs';
import { generateToc } from './operations/generateToc.mjs';
import { addHeadingNumbering } from './operations/addHeadingNumbering.mjs';

/**
 * Applies a series of operations to the Markdown AST.
 *
 * @param {object} tree - The Markdown AST.
 * @param {Array} operations - An array of operation objects.
 * @param {object} config - Configuration object (e.g., front matter).
 * @param {string} requestId - Unique identifier for the request.
 */
export const applyOperations = (tree, operations, config, requestId) => {
  // Mapping of operation types to handler functions
  const operationHandlers = {
    change_heading: changeHeading,
    emphasize_text: emphasizeText,
    generate_toc: generateToc,
    add_heading_numbering: addHeadingNumbering,
    // Add more mappings as new operations are created
  };

  operations.forEach((op) => {
    const handler = operationHandlers[op.type];
    if (handler) {
      try {
        handler(tree, op.parameters, requestId);
        logger.debug(`Applied operation: ${op.type}`, { requestId });
      } catch (error) {
        logger.error(`Failed to apply operation: ${op.type}`, { requestId, error: error.message });
        // Depending on requirements, you might choose to continue or halt on error
      }
    } else {
      logger.warn(`Unknown operation type: ${op.type}`, { requestId });
    }
  });
};
