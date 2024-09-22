import { visit } from 'unist-util-visit';
import logger from '../../config/logger.mjs';

/**
 * Emphasizes specific text within the document by wrapping it with a strong node (bold),
 * but skips text that is already bold and only matches whole words.
 * Optionally, the operation can be limited to a specific line number if provided.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters.
 * @param {string} parameters.text - The text to emphasize.
 * @param {number} [parameters.lineNumber] - Optional line number to restrict the emphasis to.
 * @param {string} requestId - Unique identifier for the request.
 */
export const emphasizeText = (tree, parameters, requestId) => {
  const { text, lineNumber } = parameters;
  if (!text) return;

  const wordRegex = new RegExp(`\\b${text}\\b`, 'g');

  visit(tree, (node, index, parent) => {
    // If a specific line number is provided, only emphasize text on that line
    if (lineNumber && node.position && node.position.start.line !== lineNumber) {
      //logger.debug(`Skipping node line ${node.position.start.line} not target line ${lineNumber}: ${node.value}`, { requestId });
      return;
    }

    // Check for text nodes and apply emphasis
    if (node.type === 'text' && node.value.trim() !== '') {
      const nodeValue = node.value;

      // Skip if the parent is already bolded
      if (parent.type === 'strong') {
        logger.debug(`Skipping already bold text: ${nodeValue}`, { requestId });
        return;
      }

      let startIndex = 0;
      const newNodes = [];

      while (startIndex < nodeValue.length) {
        // Find the next match using the regular expression for word boundaries
        const match = wordRegex.exec(nodeValue.slice(startIndex));
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
          children: [{ type: 'text', value: match[0] }],
        });

        startIndex = matchIndex + match[0].length;
      }

      // Replace the original node with the new nodes
      if (newNodes.length > 0) {
        logger.debug(`Replacing original node with emphasized text`, { requestId });
        parent.children.splice(index, 1, ...newNodes);
      }
    }
  });
};
