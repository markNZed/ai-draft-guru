// backend/src/services/templateService.mjs

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { parseYAMLFrontMatter } from '../utils/frontMatterParser.mjs';
import { applyOperations } from '../utils/operationsApplier.mjs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import logger from '../config/logger.mjs';
import yaml from 'js-yaml';
import axios from 'axios'; // Ensure axios is installed if not already

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Assume that the list of available templates is fetched from the /templates endpoint
// Alternatively, you can read the directory directly if preferred

/**
 * Fetches the list of available templates.
 * 
 * @param {string} requestId - Unique identifier for the request.
 * @returns {Array<string>} - List of template names.
 */
const fetchAvailableTemplates = async (requestId) => {
  try {
    const templatesPath = path.join(__dirname, '..', '..', 'templates');
    const files = await fs.readdir(templatesPath);
    const templates = files
      .filter((file) => path.extname(file).toLowerCase() === '.md')
      .map((file) => path.basename(file, '.md'));
    return templates;
  } catch (error) {
    logger.error('Error fetching available templates', {
      requestId,
      error: error.message,
    });
    throw new Error('Failed to fetch available templates.');
  }
};

/**
 * Fetches and processes the specified template.
 *
 * @param {string} requestId - Unique identifier for the request.
 * @param {string} [name] - The name of the template to fetch.
 * @returns {string} - The processed template content.
 */
export const getProcessedTemplate = async (requestId, name) => {
  // Fetch available templates dynamically
  const availableTemplates = await fetchAvailableTemplates(requestId);

  // Default to 'default' template if no name is provided
  const templateName = name || 'default';

  if (!availableTemplates.includes(templateName)) {
    throw new Error('Invalid template name.');
  }

  const templatePath = path.join(__dirname, '..', '..', 'templates', `${templateName}.md`);

  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    const parsed = parseYAMLFrontMatter(content);
    const config = parsed.config;
    let markdownContent = parsed.markdownContent;

    // Parse the original document content into AST
    const parser = unified().use(remarkParse);
    const tree = parser.parse(markdownContent);
    logger.debug('Parsed template content into AST', { requestId, tree });

    // Define operations based on front matter
    const operations = [];

    if (config.toc) {
      operations.push({
        type: 'generate_toc',
        parameters: {},
      });
    }

    if (config.numbering) {
      operations.push({
        type: 'add_heading_numbering',
        parameters: {},
      });
    }

    await applyOperations(tree, operations, config, requestId);
    logger.debug('Applied front matter operations to AST', { requestId, tree });

    // Serialize the modified AST back to Markdown
    // Needed cusotm escaping to avoid double escaping then [...] would appear as \[...] in the Markdown editor
    const serializer = unified().use(remarkStringify, {
      listItemIndent: '1',
      handlers: {
        text(node) {
          // Return the value as-is without escaping backslashes
          return node.value.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
        },
      },
    });
    let modifiedContent = serializer.stringify(tree);
    logger.debug('Serialized modified AST back to Markdown', { requestId, modifiedContent });

    // Reattach YAML front matter as HTML comments if it was present
    if (Object.keys(config).length > 0) {
      const yamlContent = yaml.dump(config).trim();
      modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
    }

    return modifiedContent;
  } catch (error) {
    logger.error('Error processing template.md', {
      requestId,
      error: error.message,
    });
    throw new Error('Failed to process template.');
  }
};
