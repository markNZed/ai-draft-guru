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
    // Only process nodes with position information
    if (!node.position) return;

    // Determine if we should process this node based on lineNumber
    if (lineNumber) {
      const { start, end } = node.position;
      if (lineNumber < start.line || lineNumber > end.line) {
        logger.debug(`Skipping node lines ${start.line}-${end.line}, not target line ${lineNumber}: ${node.value}`, { requestId });
        return;
      }
    }

    // Check for text nodes and apply emphasis
    if (node.type === 'text' && node.value.trim() !== '') {
      const nodeValue = node.value;

      // Skip if the parent is already bolded
      if (parent.type === 'strong') {
        logger.debug(`Skipping already bold text: ${nodeValue}`, { requestId });
        return;
      }

      if (!lineNumber) {
        // No lineNumber specified, process entire node
        let match;
        const newNodes = [];
        let lastIndex = 0;

        while ((match = wordRegex.exec(nodeValue)) !== null) {
          const matchStart = match.index;
          const matchEnd = wordRegex.lastIndex;

          if (matchStart > lastIndex) {
            newNodes.push({
              type: 'text',
              value: nodeValue.slice(lastIndex, matchStart),
            });
          }

          newNodes.push({
            type: 'strong',
            children: [{ type: 'text', value: match[0] }],
          });

          lastIndex = matchEnd;
        }

        if (lastIndex < nodeValue.length) {
          newNodes.push({
            type: 'text',
            value: nodeValue.slice(lastIndex),
          });
        }

        if (newNodes.length > 0) {
          logger.debug(`Replacing original node with emphasized text`, { requestId, newNodes });

          parent.children.splice(index, 1, ...newNodes);

          // Return `SKIP` to prevent further traversal into newly added nodes
          return [visit.SKIP];
        }
      } else {
        // lineNumber is specified, process only the part of the node on that line
        const { start, end } = node.position;

        // Calculate the number of characters per line
        const lines = nodeValue.split('\n');
        if (lineNumber < start.line || lineNumber > end.line) {
          // Already handled above, but just in case
          return;
        }

        // Determine which line within the node corresponds to the target lineNumber
        const targetLineIndex = lineNumber - start.line;
        if (targetLineIndex < 0 || targetLineIndex >= lines.length) {
          // Line number out of bounds
          return;
        }

        const targetLine = lines[targetLineIndex];
        const targetLineStartChar = lines.slice(0, targetLineIndex).reduce((acc, line) => acc + line.length + 1, 0); // +1 for '\n'
        const targetLineEndChar = targetLineStartChar + targetLine.length;

        // Find matches within the target line
        const matches = [];
        let match;
        while ((match = wordRegex.exec(targetLine)) !== null) {
          matches.push({ index: match.index + targetLineStartChar, match: match[0] });
        }

        if (matches.length === 0) return;

        const newNodes = [];
        let lastIndex = 0;

        for (const { index: matchIndex, match: matchText } of matches) {
          const relativeMatchIndex = matchIndex - targetLineStartChar;

          if (matchIndex > lastIndex) {
            newNodes.push({
              type: 'text',
              value: nodeValue.slice(lastIndex, matchIndex),
            });
          }

          newNodes.push({
            type: 'strong',
            children: [{ type: 'text', value: matchText }],
          });

          lastIndex = matchIndex + matchText.length;
        }

        if (lastIndex < nodeValue.length) {
          newNodes.push({
            type: 'text',
            value: nodeValue.slice(lastIndex),
          });
        }

        if (newNodes.length > 0) {
          logger.debug(`Replacing original node with emphasized text on line ${lineNumber}`, { requestId, newNodes });

          parent.children.splice(index, 1, ...newNodes);

          // Return `SKIP` to prevent further traversal into newly added nodes
          return [visit.SKIP];
        }
      }
    }
  });
};
