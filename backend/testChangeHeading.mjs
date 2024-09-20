// backend/testChangeHeading.mjs

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import yaml from 'js-yaml';
import logger from './config/logger.mjs'; // Ensure this path is correct
import { applyOperations } from './utils/operationsApplier.mjs'; // Ensure this path is correct

// Sample Markdown Content with Numbering
const sampleMarkdown = `
<!--
toc: true
numbering: true
-->

# 1 Introduction

Welcome to **AI-Draft-Guru**! This tool helps you create and manipulate Markdown documents with ease.

## 1.1 Contents

* [Features](#features)
* [Getting Started](#getting-started)
`;

// Expected Heading Text after Change
const expectedHeadingText = '1 Intro';

// Define the operation to change "Introduction" to "Intro"
const operations = {
  operations: [
    {
      type: 'change_heading',
      parameters: {
        match: 'Introduction',
        newText: 'Intro',
      },
    },
  ],
};

/**
 * Function to find a heading in the AST by its depth and verify its text.
 *
 * @param {object} tree - The Markdown AST.
 * @param {number} depth - The heading level (e.g., 1 for '#').
 * @param {string} expectedText - The expected heading text after change.
 * @returns {boolean} - True if the heading text matches, else false.
 */
const verifyHeadingChange = (tree, depth, expectedText) => {
  let isChanged = false;

  unified()
    .use(remarkParse)
    .use(() => (tree) => {
      visit(tree, 'heading', (node) => {
        if (node.depth === depth) {
          const textNode = node.children.find(child => child.type === 'text');
          if (textNode) {
            if (textNode.value === expectedText) {
              isChanged = true;
            } else {
              logger.debug(`Heading text mismatch. Expected: "${expectedText}", Found: "${textNode.value}"`);
            }
          }
        }
      });
    })
    .runSync(tree);

  return isChanged;
};

// Import the `visit` function
import { visit } from 'unist-util-visit';

/**
 * Test Function
 */
const testChangeHeading = () => {
  try {
    // Parse YAML Front Matter
    const frontMatterMatch = sampleMarkdown.match(/^<!--\n([\s\S]*?)\n-->\n([\s\S]*)$/);
    let config = {};
    let markdownContent = sampleMarkdown;

    if (frontMatterMatch) {
      const yamlContent = frontMatterMatch[1];
      markdownContent = frontMatterMatch[2];
      config = yaml.load(yamlContent);
      logger.debug('Parsed YAML front matter', { config });
    }

    // Parse Markdown to AST
    const parser = unified().use(remarkParse);
    const tree = parser.parse(markdownContent);
    logger.debug('Parsed document content into AST');

    // Apply Operations
    applyOperations(tree, operations.operations, config, 'test-request-id');
    logger.debug('Applied operations to AST');

    // Serialize AST back to Markdown
    const serializer = unified().use(remarkStringify);
    let modifiedContent = serializer.stringify(tree);
    logger.debug('Serialized modified AST back to Markdown');

    // Reattach YAML front matter as HTML comments if present
    if (Object.keys(config).length > 0) {
      const yamlContent = yaml.dump(config).trim();
      modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
    }

    // Parse the modified Markdown to verify the heading change
    const modifiedTree = parser.parse(modifiedContent);

    // Verify the heading change
    const isHeadingChanged = verifyHeadingChange(modifiedTree, 1, expectedHeadingText);

    if (isHeadingChanged) {
      console.log('✅ Test Passed: Heading was successfully changed.');
    } else {
      console.log('❌ Test Failed: Heading was not changed as expected.');
      console.log('\n--- Expected Heading Text ---\n');
      console.log(expectedHeadingText);
      console.log('\n--- Actual Heading Text ---\n');
      
      // Find and print the actual heading text for debugging
      let actualHeadingText = '';
      visit(modifiedTree, 'heading', (node) => {
        if (node.depth === 1) {
          const textNode = node.children.find(child => child.type === 'text');
          if (textNode) {
            actualHeadingText = textNode.value;
          }
        }
      });
      console.log(actualHeadingText);
    }
  } catch (error) {
    console.error('❌ Test Failed with an error:', error);
  }
};

// Run the Test
testChangeHeading();
