import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import logger from '../../config/logger.mjs';
import { toHtml } from 'hast-util-to-html';
import HTMLtoDOCX from 'html-to-docx';

export const convertToDoc = async (tree, parameters, requestId) => {
  logger.debug('Converting Markdown AST to .docx', { requestId });

  try {

    const processor = unified()
    .use(remarkRehype)      // Convert Markdown AST (MDAST) to HTML AST (HAST)
    .use(rehypeStringify);  // Convert HTML AST to a string

    const hast = await processor.run(tree);

    const html = toHtml(hast);

    // Wrap the generated HTML content with a basic HTML structure
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated HTML</title>
      </head>
      <body>
          ${html}
      </body>
      </html>
    `;

    const docxBuffer = await HTMLtoDOCX(fullHtml);

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
