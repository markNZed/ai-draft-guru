// backend/src/services/commandService.mjs

import fs from 'fs/promises';
import path from 'path';
import { getFilePath } from '../utils/pathUtils.mjs';
import { parseYAMLFrontMatter } from '../utils/frontMatterParser.mjs';
import { applyOperations } from '../utils/operationsApplier.mjs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { addRowNumbers } from '../utils/rowNumberUtils.mjs';
import logger from '../config/logger.mjs';
import { constructPrompt } from '../utils/promptBuilder.mjs';
import { createChatCompletion } from './openaiService.mjs';
import yaml from 'js-yaml';

/**
 * Applies a command to a single file: processes, modifies, and writes back.
 *
 * @param {string} projectName - The name of the project.
 * @param {string} fileName - The name of the file (with extension).
 * @param {string} command - The command to apply.
 * @param {string} type - The type of command (e.g., 'default', 'script').
 * @param {string} requestId - Unique identifier for the request.
 * @returns {object} - Result of the operation.
 */
export const applyCommandToFile = async (projectName, fileName, command, type, requestId) => {
  try {
    // Resolve the absolute file path
    const filePath = getFilePath(projectName, fileName); // Ensures '.md' extension
    
    // Read the original file content
    const documentContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse YAML front matter if present
    let yamlConfig = {};
    let markdownContent = documentContent;
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
    
    // Insert row numbers (optional based on command type)
    const contentWithLineNumbers = addRowNumbers(markdownContent);
    
    // Construct AI prompt based on command type
    let prompt;
    if (type === 'free-form' || type === 'script' || type === 'script-gen') {
      prompt = constructPrompt(command, type, markdownContent);
    } else {
      prompt = constructPrompt(command, type, contentWithLineNumbers);
    }
    
    // Generate AI response
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
    
    // Clean AI response by removing code block formatting if present
    const cleanedAiText = aiText
      .replace(/```(?:json|markdown|javascript)?\s*/g, '')
      .replace(/```/g, '');
    
    let modifiedContent = '';
    let operations = {};
    let specialResults = {};
    
    if (type === 'free-form' || type === 'script' || type === 'script-gen') {
      // For these types, AI provides the full modified content
      modifiedContent = cleanedAiText;
    } else {
      // For other types, AI provides operations to apply
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
      
      // Parse the markdown content into AST
      const processor = unified().use(remarkParse);
      const tree = processor.parse(markdownContent);
      logger.debug('Parsed document content into AST', { tree });
      
      // Apply the operations to the AST
      specialResults = await applyOperations(tree, operations.operations, yamlConfig, requestId);
      logger.debug('Applied operations to AST', { requestId });
      
      // Serialize the modified AST back to Markdown
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
      
      // Reattach YAML front matter as HTML comments if present and not a script type
      if (type !== 'script' && type !== 'script-gen') {
        if (Object.keys(yamlConfig).length > 0) {
          const yamlContent = yaml.dump(yamlConfig).trim();
          modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
        }
      }
    }
    
    // Write the modified content back to the file
    await fs.writeFile(filePath, modifiedContent, 'utf-8');
    logger.info(`File updated successfully: ${filePath}`, { requestId });
    
    // Handle special results (e.g., generating MP3 or DOCX)
    if (specialResults.mp3Buffer) {
      const mp3Path = path.join(path.dirname(filePath), `${path.basename(filePath, '.md')}.mp3`);
      await fs.writeFile(mp3Path, specialResults.mp3Buffer);
      logger.info(`MP3 file created successfully: ${mp3Path}`, { requestId });
    }
    
    if (specialResults.docxBuffer) {
      const docxPath = path.join(path.dirname(filePath), `${path.basename(filePath, '.md')}.docx`);
      await fs.writeFile(docxPath, specialResults.docxBuffer);
      logger.info(`DOCX file created successfully: ${docxPath}`, { requestId });
    }
    
    // Prepare and return the response object
    const responseObject = {
      originalContent: documentContent,
      modifiedContent: modifiedContent,
      operationsApplied: operations.operations || [],
      specialResults: {
        mp3: specialResults.mp3Buffer ? `${path.basename(fileName, '.md')}.mp3` : undefined,
        docx: specialResults.docxBuffer ? `${path.basename(fileName, '.md')}.docx` : undefined,
      },
      message: 'File updated successfully.',
    };
    
    return { status: 200, data: responseObject };
  } catch (error) {
    logger.error('Error applying command to file', { requestId, error: error.message });
    throw error; // Re-throw to be handled by the route
  }
};
