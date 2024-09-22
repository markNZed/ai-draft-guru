// backend/utils/rowNumberUtils.mjs

/**
 * Appends [ROW X] markers at the end of each line.
 * @param {string} content - The original Markdown content.
 * @returns {string} - The Markdown content with row markers appended.
 */
export const addRowNumbers = (content) => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    return `${line}[ROW ${index + 1}]`;
  }).join('\n');
};

export const removeRowNumbers = (content) => {
  // Use a regular expression to match and remove [ROW X] markers
  return content.replace(/\[ROW \d+\]/g, '');
};

