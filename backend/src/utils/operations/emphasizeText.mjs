// backend/src/utils/operations/emphasizeText.mjs

import { visit } from 'unist-util-visit';
import logger from '../../config/logger.mjs';

/**
 * Emphasizes specific text within the document by wrapping it with a strong node (bold),
 * but skips text that is already bold and only matches whole words.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters.
 * @param {string} parameters.text - The text to emphasize.
 * @param {string} requestId - Unique identifier for the request.
 */
export const emphasizeText = (tree, parameters, requestId) => {
  const { text } = parameters;

  if (!text) return;

  // Use a regular expression to match whole words
  const wordRegex = new RegExp(`\\b${text}\\b`);

  visit(tree, 'text', (node, index, parent) => {
    const nodeValue = node.value;

    // Check if the parent node is already a 'strong' (bold) element
    if (parent.type === 'strong') {
      logger.debug(`Skipping already bold text: ${nodeValue}`, { requestId });
      return;
    }

    let startIndex = 0;
    const newNodes = [];

    while (startIndex < nodeValue.length) {
      // Find the next match using the regular expression for word boundaries
      const match = nodeValue.slice(startIndex).match(wordRegex);
      if (!match) {
        newNodes.push({
          type: 'text',
          value: nodeValue.slice(startIndex),
        });
        break;
      }

      const matchIndex = startIndex + match.index;

      if (matchIndex > startIndex) {
        newNodes.push({
          type: 'text',
          value: nodeValue.slice(startIndex, matchIndex),
        });
      }

      // Wrap the matched text in a strong (bold) node
      newNodes.push({
        type: 'strong',
        children: [{ type: 'text', value: nodeValue.slice(matchIndex, matchIndex + text.length) }],
      });

      startIndex = matchIndex + text.length;
    }

    // Replace the original node with the new nodes
    if (newNodes.length > 0) {
      parent.children.splice(index, 1, ...newNodes);
    }
  });
};
