// backend/routes/applyCommand.mjs

import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import logger from '../config/logger.mjs';
import { constructPrompt } from '../utils/promptBuilder.mjs';
import { createChatCompletion } from '../services/openaiService.mjs';
import { parseYAMLFrontMatter } from '../utils/frontMatterParser.mjs';
import { applyOperations } from '../utils/operationsApplier.mjs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import yaml from 'js-yaml';
import { addRowNumbers } from '../utils/rowNumberUtils.mjs';
import { parseRowMarkers } from '../utils/parseRowMarkers.mjs';
import { removeRowNumberNodes } from '../utils/removeRowNumberNodes.mjs';
import { remove } from 'unist-util-remove'; // For removing nodes

const router = express.Router();

router.post(
  '/',
  [
    body('command').isString().notEmpty(),
    body('documentContent').isString().notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const { id: requestId } = req;
    logger.debug('Received /apply-command request', {
      requestId,
      body: req.body,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { requestId, errors: errors.array() });
      return res
        .status(400)
        .json({ message: 'Invalid input.', errors: errors.array() });
    }

    const { command, documentContent } = req.body;

    const testProcessor = unified().use(remarkParse);

    const testTree = testProcessor.parse(documentContent);
    logger.debug('Parsed original document content into AST', { testTree });

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
    logger.debug('Inserted row numbers into content', { contentWithLineNumbers });

    // Step 2: Construct prompt with modified content
    const prompt = constructPrompt(command, contentWithLineNumbers);
    logger.debug('Constructed prompt for OpenAI', { requestId, prompt });

    try {
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
        .replace(/```json\s*/g, '') // Remove the opening ```json
        .replace(/```/g, '');       // Remove the closing ```

      let operations;
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
        return res
          .status(500)
          .json({ message: 'Invalid response format from AI service.' });
      }


      // Step 3: Parse the document content into AST with row markers
      const processor = unified()
        .use(remarkParse)
        .use(parseRowMarkers);  // Add the custom plugin here to handle [ROW X]

      const tree = processor.parse(contentWithLineNumbers);
      logger.debug('Parsed document content into AST', { tree });

      // Execute the processor to apply plugins
      await processor.run(tree);
      logger.debug('Executed plugins on AST', { requestId, tree });

      // Step 4: Apply the operations to the AST
      applyOperations(tree, operations.operations, yamlConfig, requestId);
      logger.debug('Applied operations to AST', { requestId });

      // Step 5: Remove `rowNumber` nodes before serialization
      removeRowNumberNodes()(tree); 
      logger.debug('Removed rowNumber nodes from AST', { requestId, tree });

      // Step 6: Serialize the modified AST back to Markdown
      const serializer = unified()
        .use(remarkStringify);
      let modifiedContent = serializer.stringify(tree);
      logger.debug('Serialized modifiedContent:', { modifiedContent });

      // Step 8: Reattach YAML front matter as HTML comments if it was present
      if (Object.keys(yamlConfig).length > 0) {
        const yamlContent = yaml.dump(yamlConfig).trim();
        modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
      }

      // Log final content before sending
      logger.debug('Final modifiedContent before sending:', { yamlConfig, modifiedContent });

      res.json({ 
        originalContent: documentContent, 
        modifiedContent: modifiedContent, 
        operationsApplied: operations.operations,
        message: 'Success' 
      });
    } catch (error) {
      logger.error('Error communicating with AI service', {
        requestId,
        error: error.message,
        stack: error.stack,
      });
      return res
        .status(500)
        .json({ message: 'Error communicating with AI service.' });
    }
  })
);

export default router;
