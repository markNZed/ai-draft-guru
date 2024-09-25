// backend/src/services/commandService.mjs

import path from 'path';
import fs from 'fs/promises';
import { parseYAMLFrontMatter } from '../utils/frontMatterParser.mjs';
import { applyOperations } from '../utils/operationsApplier.mjs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import yaml from 'js-yaml';
import { addRowNumbers } from '../utils/rowNumberUtils.mjs';
import logger from '../config/logger.mjs';
import { constructPrompt } from '../utils/promptBuilder.mjs';
import { createChatCompletion } from '../services/openaiService.mjs';

/**
 * Applies a command to a single file.
 *
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} command
 * @param {string} type - Type of command (e.g., 'bulk', 'single')
 * @param {string} requestId
 * @returns {object} - Result of the operation
 */
export const applyCommandToFile = async (projectId, fileId, command, type, requestId) => {
  const projectsBaseDir = path.join(path.resolve(), 'projects');
  const filePath = path.join(projectsBaseDir, projectId, `${fileId}.md`);

  try {
    // Read file content
    const documentContent = await fs.readFile(filePath, 'utf-8');

    // Parse YAML front matter if present
    let yamlConfig = {};
    let markdownContent = documentContent; // Use content with row numbers
    try {
      const parsed = parseYAMLFrontMatter(documentContent);
      yamlConfig = parsed.config;
      markdownContent = parsed.markdownContent;
      logger.debug('Parsed YAML front matter', { requestId, config: yamlConfig });
    } catch (yamlError) {
      logger.warn('Failed to parse YAML front matter.', {
        requestId,
        error: yamlError.message,
      });
      // Proceed without YAML configuration
    }

    // Step 1: Insert row numbers (appended to lines)
    const contentWithLineNumbers = addRowNumbers(markdownContent);
    // Step 2: Construct prompt with modified content
    let prompt;
    if (type === 'free-form' || type === 'script' || type === 'script-gen') {
      prompt = constructPrompt(command, type, markdownContent);
    } else {
      prompt = constructPrompt(command, type, contentWithLineNumbers);
    }

    const aiText = await createChatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a helpful assistant for restructuring and restyling markdown documents.',
        },
        { role: 'user', content: prompt },
      ],
      requestId
    );

    logger.debug(`AI Response: ${aiText}`, { requestId });

    // Clean up the AI response by removing code block formatting
    const cleanedAiText = aiText
      .replace(/```(?:json|markdown|javascript)?\s*/g, '')
      .replace(/```/g, ''); // Remove the closing ```

    let modifiedContent = '';
    let operations = {};
    let specialResults = {};

    if (type === 'free-form' || type === 'script' || type === 'script-gen') {
      modifiedContent = cleanedAiText;
    } else {
      try {
        operations = JSON.parse(cleanedAiText);
        if (!operations.operations || !Array.isArray(operations.operations)) {
          throw new Error('Invalid operations format.');
        }
        logger.debug('Parsed operations from AI response', {
          requestId,
          operations,
        });
      } catch (parseError) {
        logger.error('Error parsing AI response as JSON', {
          requestId,
          error: parseError.message,
        });
        throw new Error('Invalid response format from AI service.');
      }

      // Step 3: Parse the document content into AST
      const processor = unified()
        .use(remarkParse);
      const tree = processor.parse(markdownContent);
      logger.debug('Parsed document content into AST', { tree });

      // Step 4: Apply the operations to the AST
      specialResults = await applyOperations(tree, operations.operations, yamlConfig, requestId);
      logger.debug('Applied operations to AST', { requestId });

      // Step 5: Serialize the modified AST back to Markdown
      const serializer = unified()
        .use(remarkStringify, {
          listItemIndent: '1',
          handlers: {
            text(node) {
              // Return the value as-is without escaping backslashes
              return node.value.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
            },
          },
        });
      modifiedContent = serializer.stringify(tree);
      logger.debug('Serialized modified AST back to Markdown', { requestId, modifiedContent });

      // Step 6: Reattach YAML front matter as HTML comments if it was present
      if (type !== 'script' && type !== 'script-gen') {
        if (Object.keys(yamlConfig).length > 0) {
          const yamlContent = yaml.dump(yamlConfig).trim();
          modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
        }
      }

      // Handle file write operations
      if (type !== 'script' && type !== 'script-gen') {
        await fs.writeFile(filePath, modifiedContent, 'utf-8');
        logger.info('File content updated', { projectId, fileId });
      }
    }

    // Handle MP3 and DOCX conversions if applicable
    // ... (similar to applyCommandRouter)

    // Prepare the response object
    const responseObject = { 
      originalContent: documentContent, 
      modifiedContent: modifiedContent, 
      operationsApplied: operations.operations,
      message: 'Success' 
    };

    return { status: 200, data: responseObject };
  } catch (error) {
    logger.error('Error applying command to file', { requestId, error: error.message });
    throw error;
  }
};
