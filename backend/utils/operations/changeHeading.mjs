// backend/utils/operations/changeHeading.mjs

import { visit } from 'unist-util-visit';
import logger from '../../config/logger.mjs';

/**
 * Changes the text of a heading that matches a specific string.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters.
 * @param {string} parameters.match - The text to match in the heading.
 * @param {string} parameters.newText - The new text to replace the matched text.
 * @param {string} requestId - Unique identifier for the request.
 */
export const changeHeading = (tree, parameters, requestId) => {
  const { match, newText } = parameters;

  visit(tree, 'heading', (node) => {
    node.children.forEach((child) => {
      if (child.type === 'text' && child.value.includes(match)) {
        const updatedValue = child.value.replace(match, newText);
        logger.debug(`Changing heading from "${child.value}" to "${updatedValue}"`, { requestId });
        child.value = updatedValue; // Replace the matched text
      }
    });
  });
};
