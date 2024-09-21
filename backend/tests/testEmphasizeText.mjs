// testEmphasizeText.mjs
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { emphasizeText } from './utils/operations/emphasizeText.mjs';

// Utility to process Markdown
const processMarkdown = (markdown, textToEmphasize) => {
  const parser = unified().use(remarkParse);
  const tree = parser.parse(markdown);

  // Call the emphasizeText function with the Markdown AST
  emphasizeText(tree, { text: textToEmphasize }, 'test-request-id');

  const serializer = unified().use(remarkStringify);
  return serializer.stringify(tree);
};

describe('emphasizeText function', () => {
  it('should emphasize the whole word', () => {
    const inputMarkdown = 'This is a test of the word you.';
    const expectedOutput = 'This is a test of the word **you**.';
    
    const result = processMarkdown(inputMarkdown, 'you');
    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it('should not emphasize parts of words', () => {
    const inputMarkdown = 'This is your test.';
    const expectedOutput = 'This is your test.'; // "your" should not be emphasized

    const result = processMarkdown(inputMarkdown, 'you');
    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it('should skip already bolded text', () => {
    const inputMarkdown = 'This is **you**.';
    const expectedOutput = 'This is **you**.'; // Should remain unchanged

    const result = processMarkdown(inputMarkdown, 'you');
    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it('should emphasize multiple occurrences of the word', () => {
    const inputMarkdown = 'You are important. You are needed.';
    const expectedOutput = '**You** are important. **You** are needed.';

    const result = processMarkdown(inputMarkdown, 'You');
    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it('should handle case-sensitive matches', () => {
    const inputMarkdown = 'you are important. YOU are loud.';
    const expectedOutput = '**you** are important. **YOU** are loud.';

    const result = processMarkdown(inputMarkdown, 'you');
    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it('should emphasize the word even if it appears in different sentences', () => {
    const inputMarkdown = 'you. You. YOU.';
    const expectedOutput = '**you**. **You**. **YOU**.';

    const result = processMarkdown(inputMarkdown, 'you');
    expect(result.trim()).toBe(expectedOutput.trim());
  });
});
