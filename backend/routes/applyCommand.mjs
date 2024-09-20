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
import { config } from '../config/index.mjs';

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

    const prompt = constructPrompt(command, documentContent);
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
        .replace(/```json\s*/g, '')  // Remove the opening ```json
        .replace(/```/g, '');        // Remove the closing ```

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

      // Parse YAML front matter if present
      let config = {};
      let markdownContent = documentContent;
      try {
        const parsed = parseYAMLFrontMatter(documentContent);
        config = parsed.config;
        markdownContent = parsed.markdownContent;
        logger.debug('Parsed YAML front matter', { requestId, config });
      } catch (yamlError) {
        logger.warn('Failed to parse YAML front matter.', {
          requestId,
          error: yamlError.message,
        });
        // Proceed without YAML configuration
      }

      // Parse the original document content into AST
      const parser = unified().use(remarkParse);
      const tree = parser.parse(markdownContent);
      logger.debug('Parsed document content into AST', { requestId });

      // Apply the operations to the AST
      applyOperations(tree, operations.operations, config, requestId);
      logger.debug('Applied operations to AST', { requestId });

      // Serialize the modified AST back to Markdown
      const serializer = unified().use(remarkStringify);
      let modifiedContent = serializer.stringify(tree);
      logger.debug('Serialized modified AST back to Markdown', { requestId });

      // Reattach YAML front matter as HTML comments if it was present
      if (Object.keys(config).length > 0) {
        const yamlContent = yaml.dump(config).trim();
        modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
      }

      logger.info('Document successfully modified', { requestId });
      res.json({ modifiedContent, message: 'Success' });
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
