// backend/utils/operations/emphasizeText.mjs

import { visit } from 'unist-util-visit';
import logger from '../../config/logger.mjs';

/**
 * Emphasizes specific text within the document by wrapping it with double asterisks.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters.
 * @param {string} parameters.text - The text to emphasize.
 * @param {string} requestId - Unique identifier for the request.
 */
export const emphasizeText = (tree, parameters, requestId) => {
  const { text } = parameters;

  visit(tree, 'text', (node) => {
    if (node.value.includes(text)) {
      logger.debug(`Emphasizing text: ${text}`, { requestId });
      node.value = node.value.split(text).join(`**${text}**`);
    }
  });
};
