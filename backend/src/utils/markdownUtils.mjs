import { visit } from 'unist-util-visit';
import logger from '../config/logger.mjs';

/**
 * Convert Markdown AST to plain text by visiting all text nodes.
 * 
 * @param {object} tree - The Markdown AST.
 * @returns {string} - The plain text content.
 */
export const convertMarkdownToText = (tree) => {
  let plainText = '';

  visit(tree, 'text', (node) => {
    plainText += `${node.value} `;
  });

  logger.debug(`plainText: ${plainText}`);

  return plainText.trim(); // Return the plain text, stripping excess whitespace
};
