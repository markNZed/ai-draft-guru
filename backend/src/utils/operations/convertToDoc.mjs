// backend/src/utils/operations/convertToDoc.mjs

import { unified } from 'unified';
import remarkHtml from 'remark-html';
import htmlDocx from 'html-docx-js';
import logger from '../../config/logger.mjs';

/**
 * Converts the Markdown AST to a .docx Buffer.
 *
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters (currently unused).
 * @param {string} requestId - Unique identifier for the request.
 * @returns {Buffer} - The .docx file as a Buffer.
 */
export const convertToDoc = async (tree, parameters, requestId) => {
  logger.debug('Converting Markdown to .docx', { requestId });

  try {
    // Create a processor with both parse and html plugins
    const processor = unified()
      .use(remarkHtml);

    // Use the processor to stringify the AST to HTML
    const html = await processor.stringify(tree);

    logger.debug('Converted Markdown AST to HTML', { requestId });

    // Convert the HTML to .docx Buffer
    const docxBuffer = htmlDocx.asBuffer(html);

    logger.debug('Converted HTML to .docx Buffer', { requestId });

    return docxBuffer;
  } catch (error) {
    logger.error('Error during Markdown to .docx conversion', {
      requestId,
      error: error.message,
    });
    throw error;
  }
};
