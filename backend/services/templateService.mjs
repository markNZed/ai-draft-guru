// backend/services/templateService.mjs

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export const getProcessedTemplate = async (requestId) => {
  const templatePath = path.join(__dirname, '..', 'templates', 'template.md');

  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    const parsed = parseYAMLFrontMatter(content);
    const config = parsed.config;
    let markdownContent = parsed.markdownContent;

    // Parse the original document content into AST
    const parser = unified().use(remarkParse);
    const tree = parser.parse(markdownContent);
    logger.debug('Parsed template content into AST', { requestId });

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

    applyOperations(tree, operations, config, requestId);
    logger.debug('Applied front matter operations to AST', { requestId });

    // Serialize the modified AST back to Markdown
    const serializer = unified().use(remarkStringify);
    let modifiedContent = serializer.stringify(tree);
    logger.debug('Serialized modified AST back to Markdown', { requestId });

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
