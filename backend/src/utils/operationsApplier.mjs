// backend/src/utils/operationsApplier.mjs

import logger from '../config/logger.mjs';
import { changeHeading } from './operations/changeHeading.mjs';
import { emphasizeText } from './operations/emphasizeText.mjs';
import { generateToc } from './operations/generateToc.mjs';
import { addHeadingNumbering } from './operations/addHeadingNumbering.mjs';
import { convertToDoc } from './operations/convertToDoc.mjs';
import { convertToMp3 } from './operations/convertToMp3.mjs'; // Import the new operation

/**
 * Applies a series of operations to the Markdown AST.
 *
 * @param {object} tree - The Markdown AST.
 * @param {Array} operations - An array of operation objects.
 * @param {object} config - Configuration object (e.g., front matter).
 * @param {string} requestId - Unique identifier for the request.
 * @returns {object} - An object containing any special results (e.g., docx buffer, mp3 buffer).
 */
export const applyOperations = async (tree, operations, config, requestId) => {
  // Mapping of operation types to handler functions
  const operationHandlers = {
    change_heading: changeHeading,
    emphasize_text: emphasizeText,
    generate_toc: generateToc,
    add_heading_numbering: addHeadingNumbering,
    convert_to_doc: convertToDoc,
    convert_to_mp3: convertToMp3, // Add the new operation
    // Add more mappings as new operations are created
  };

  const specialResults = {};

  for (const op of operations) {
    const handler = operationHandlers[op.type];
    if (handler) {
      try {
        if (op.type === 'convert_to_mp3') {
          // Handle convert_to_mp3 separately
          const mp3Buffer = await handler(tree, op.parameters, requestId);
          specialResults.mp3Buffer = mp3Buffer;
          logger.debug(`Applied operation: ${op.type}`, { requestId });
        } else if (op.type === 'convert_to_doc') {
          // Handle convert_to_doc separately
          const docxBuffer = await handler(tree, op.parameters, requestId);
          specialResults.docxBuffer = docxBuffer;
          logger.debug(`Applied operation: ${op.type}`, { requestId });
        } else {
          handler(tree, op.parameters, requestId);
          logger.debug(`Applied operation: ${op.type}`, { requestId });
        }
      } catch (error) {
        logger.error(`Failed to apply operation: ${op.type}`, { requestId, error: error.message });
        // Depending on requirements, you might choose to continue or halt on error
      }
    } else {
      logger.warn(`Unknown operation type: ${op.type}`, { requestId });
    }
  }

  return specialResults;
};
