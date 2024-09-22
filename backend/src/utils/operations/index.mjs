// backend/src/utils/operations/index.mjs

import { changeHeading } from './changeHeading.mjs';
import { emphasizeText } from './emphasizeText.mjs';
import { generateToc } from './generateToc.mjs';
import { addHeadingNumbering } from './addHeadingNumbering.mjs';
import { convertToDoc } from './convertToDoc.mjs';
import { convertToMp3 } from './convertToMp3.mjs'; // Import the new operation

export { 
  changeHeading, 
  emphasizeText, 
  generateToc, 
  addHeadingNumbering, 
  convertToDoc,
  convertToMp3 // Export the new operation
};

// Existing code...
