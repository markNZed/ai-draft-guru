// backend/src/routes/applyCommand.mjs

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

    const { command, documentContent, type } = req.body;

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
    if (type === 'free-form') {
      prompt = constructPrompt(command, type, markdownContent);
    } else {
      prompt = constructPrompt(command, type, contentWithLineNumbers);
    }

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
        .replace(/```markdown\s*/g, '') // Remove the opening ```markdown
        .replace(/```/g, ''); // Remove the closing ```

      let modifiedContent = '';
      let operations = {};
      let specialResults = {};

      if (type === 'free-form') {
        modifiedContent = aiText;
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
          return res
            .status(500)
            .json({ message: 'Invalid response format from AI service.' });
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
            handlers: {
              text(node) {
                // Return the value as-is without escaping backslashes
                return node.value.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
              },
            },
          });
        modifiedContent = serializer.stringify(tree);
        logger.debug('Serialized modified AST back to Markdown', { requestId });
      }

      // Step 6: Reattach YAML front matter as HTML comments if it was present
      if (Object.keys(yamlConfig).length > 0) {
        const yamlContent = yaml.dump(yamlConfig).trim();
        modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
      }

      // Prepare the response object
      const responseObject = { 
        originalContent: documentContent, 
        modifiedContent: modifiedContent, 
        operationsApplied: operations.operations,
        message: 'Success' 
      };

      // Handle MP3 conversion
      if (specialResults.mp3Buffer) {
        // Set headers and send the MP3 file as a download
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="document.mp3"',
          'Content-Length': specialResults.mp3Buffer.length,
        });
        logger.debug('Sending MP3 file in response', { requestId });
        return res.send(specialResults.mp3Buffer);
      }

      // Handle DOCX conversion if applicable
      if (specialResults.docxBuffer) {
        // Set headers and send the DOCX file as a download
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="document.docx"',
          'Content-Length': specialResults.docxBuffer.length,
        });
        logger.debug('Sending DOCX file in response', { requestId });
        return res.send(specialResults.docxBuffer);
      }

      // Log final content before sending
      logger.debug('Final modifiedContent before sending:', { yamlConfig, modifiedContent });

      res.json(responseObject);
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
