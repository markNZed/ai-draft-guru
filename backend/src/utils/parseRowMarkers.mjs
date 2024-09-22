import { visit } from 'unist-util-visit';
import logger from '../config/logger.mjs'; // Adjust the path as necessary

/**
 * A unified plugin to parse row markers [ROW X] from the end of text or any node.
 * Handles multiple markers in a single node and avoids creating empty nodes, while keeping newlines.
 */
export const parseRowMarkers = () => {
  logger.debug("parseRowMarkers plugin initialized");

  return (tree) => {
    logger.debug("Parsing tree for row markers");

    visit(tree, (node, index, parent) => {
      const nodeValue = node.value || '';

      if (!nodeValue.includes('[ROW')) {
        return; // Skip nodes that don't have any [ROW X] markers
      }

      logger.debug("Visiting node", { nodeValue });

      // Match multiple [ROW X] markers in the node
      const rowMarkerRegex = /\[ROW (\d+)\]/g;
      let match;
      const newNodes = [];
      let lastIndex = 0;

      while ((match = rowMarkerRegex.exec(nodeValue)) !== null) {
        const textBefore = nodeValue.slice(lastIndex, match.index);

        // Use the original node's type for the text before the row marker
        if (textBefore.length > 0) {
          newNodes.push({
            type: node.type,  // Preserve the original node type (e.g., 'html')
            value: textBefore,
          });
        }

        const rowNumber = parseInt(match[1], 10);
        logger.debug(`Matched row marker [ROW ${rowNumber}]`);

        // Create a special rowNumber node
        const rowNumberNode = {
          type: 'rowNumber',
          value: `[ROW ${rowNumber}]`,
          rowNumber: rowNumber,
          originalType: node.type, // Store the original node type
        };

        newNodes.push(rowNumberNode);
        lastIndex = match.index + match[0].length;
      }

      const remainingText = nodeValue.slice(lastIndex);
      if (remainingText.trim().length > 0) {
        // Use the original node's type for the remaining text
        newNodes.push({
          type: node.type,  // Preserve the original node type (e.g., 'html')
          value: remainingText,
        });
      }

      if (newNodes.length > 0 && parent && parent.children) {
        // Replace the current node with new nodes
        parent.children.splice(index, 1, ...newNodes);
        logger.debug("Replaced original node with new nodes", { newNodes });
      }
    });

    logger.debug("Finished parsing row markers");
  };
};
