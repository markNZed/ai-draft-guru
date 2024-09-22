import { visit } from 'unist-util-visit';
import logger from '../config/logger.mjs'; // Adjust the path as necessary

/**
 * A unified plugin to remove rowNumber nodes and handle newline merging.
 */
export const removeRowNumberNodes = () => {
  logger.debug("removeRowNumberNodes plugin initialized");

  return (tree) => {
    logger.debug("Removing rowNumber nodes from the AST");

    // Use visit with the reverse argument to traverse the tree backwards
    visit(tree, 'rowNumber', (node, index, parent) => {
      if (!parent || typeof index !== 'number') {
        logger.warn("rowNumber node has no parent or invalid index");
        return;
      }

      logger.debug("Visiting rowNumber node for removal", { node });

      // Remove the rowNumber node
      parent.children.splice(index, 1);
      logger.debug("Removed rowNumber node", { index });

      // After removal, attempt to merge adjacent nodes carefully, especially newlines
      mergeAdjacentNodes(parent.children, index);
    }, true);  // Passing `true` as the fourth argument to traverse in reverse

    logger.debug("Finished removing rowNumber nodes");
  };
};

/**
 * Helper function to merge adjacent nodes of the same type, only if needed.
 * This ensures that only the immediate nodes on either side of the removed node are considered.
 * @param {Array} siblings - The array of sibling nodes.
 * @param {number} index - The index where the node was removed.
 */
function mergeAdjacentNodes(siblings, index) {
  logger.debug("Merging nodes adjacent to the removed node", { index });

  const prevIndex = index - 1;
  const nextIndex = index;

  const previous = siblings[prevIndex];
  const next = siblings[nextIndex];

  // Merge only if both adjacent nodes exist and are of the same type
  if (previous && next && previous.type === 'text' && next.type === 'text') {
    const mergedValue = (previous.value + next.value).replace(/\n{2,}/g, '\n'); // Merge newlines carefully
    previous.value = mergedValue.trim();  // Ensure there are no extra spaces or newlines
    siblings.splice(nextIndex, 1); // Remove the next node after merging
    logger.debug("Merged adjacent text nodes", { previous, next });
  }
}
