// backend/utils/rowNumberUtils.mjs

/**
 * Appends [LINE X] markers at the end of each line.
 * @param {string} content - The original Markdown content.
 * @returns {string} - The Markdown content with row markers appended.
 */
export const addRowNumbers = (content) => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    return `${line}[LINE ${index + 1}]`;
  }).join('\n');
};


