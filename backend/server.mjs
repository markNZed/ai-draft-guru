// backend/server.mjs

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { Configuration, OpenAIApi } from 'openai';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import winston from 'winston';
import expressWinston from 'express-winston';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'js-yaml';
import remarkToc from 'remark-toc';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath, URL } from "url";
import { resolve } from "path";

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Uncomment the following lines to enable file logging
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Middleware to assign a unique ID to each request
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// HTTP request logging using express-winston
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: false,
  colorize: false,
  ignoreRoute: function (req, res) { return false; },
  dynamicMeta: (req, res) => ({
    requestId: req.id,
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  }),
}));

// Enable CORS for specific origins
const allowedOrigins = ['http://localhost:8080', 'https://gptengineer.app'];

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      logger.warn(`CORS rejection for Origin: ${origin}`, { requestId: req.id });
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { requestId: req.id, ip: req.ip });
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  },
});

app.use(limiter);

// Parse JSON bodies
app.use(express.json());

// Initialize OpenAI API
let openai;

if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
  logger.info('OpenAI API initialized.', { requestId: 'system' });
} else {
  logger.error('OPENAI_API_KEY is not set in the environment variables.', { requestId: 'system' });
}

// Helper Function to Construct Prompt
const constructPrompt = (command, documentContent) => {
  return `
You are an assistant that helps restructure and restyle Markdown documents. Given the following command and document content, provide the necessary instructions to modify the document.

**Command**: ${command}
**Document Content**:
${documentContent}

Provide the instructions in the following JSON format:

{
  "operations": [
    {
      "type": "operation_type",
      "parameters": { ... }
    }
    // Add more operations as needed
  ]
}

**Example:**

If the command is "Change all first-level headings to second-level and emphasize the word 'important'", the JSON should look like:

{
  "operations": [
    {
      "type": "change_heading",
      "parameters": {
        "match": "Introduction",
        "newLevel": 2
      }
    },
    {
      "type": "emphasize_text",
      "parameters": {
        "text": "important"
      }
    }
  ]
}

Only provide the JSON without any additional text.
`;
};

// Helper Function to Parse HTML Comment-based Front Matter
const parseYAMLFrontMatter = (content) => {
  // Regex to match an HTML comment-based front matter block
  const htmlCommentRegex = /^<!--\n([\s\S]*?)\n-->\n([\s\S]*)$/;
  const match = content.match(htmlCommentRegex);
  
  if (match) {
    const yamlContent = match[1]; // The YAML-like configuration inside the comment
    const markdownContent = match[2]; // The remaining markdown content
    try {
      const config = yaml.load(yamlContent); // Parse the config from YAML format
      return { config, markdownContent };
    } catch (error) {
      throw new Error('Invalid YAML front matter inside HTML comment.');
    }
  }
  
  // Fallback to regular YAML front matter parsing if no HTML comment is found
  const yamlRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const yamlMatch = content.match(yamlRegex);
  
  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    const markdownContent = yamlMatch[2];
    try {
      const config = yaml.load(yamlContent);
      return { config, markdownContent };
    } catch (error) {
      throw new Error('Invalid YAML front matter.');
    }
  }
  
  return { config: {}, markdownContent: content }; // No front matter found
};

// Helper Function to Apply Operations to AST
const applyOperations = (tree, operations, config, requestId) => {

  // Apply AI-generated operations
  operations.forEach(op => {
    switch (op.type) {
      case 'change_heading':
        {
          const { match, newLevel } = op.parameters;
          visit(tree, 'heading', (node) => {
            if (node.children && node.children[0] && node.children[0].value === match) {
              logger.debug(`Changing heading from level ${node.depth} to ${newLevel} for match: ${match}`, { requestId });
              node.depth = newLevel;
            }
          });
        }
        break;
      case 'emphasize_text':
        {
          const { text } = op.parameters;
          visit(tree, 'text', (node) => {
            if (node.value.includes(text)) {
              logger.debug(`Emphasizing text: ${text}`, { requestId });
              // Replace text with emphasized markdown syntax
              node.value = node.value.split(text).join(`**${text}**`);
            }
          });
        }
        break;
      case 'generate_toc':
          {
            logger.debug('Generating Table of Contents.', { requestId });
            // Apply remarkToc to the entire AST
          // Instead of manually adding [TOC], run the remarkToc plugin on the entire tree
          unified()
            .use(remarkToc, { tight: true }) // You can customize the TOC options here
            .runSync(tree); // Process the tree and generate the TOC

            logger.debug('TOC generated and applied to AST', { requestId });
          }
        break;
      case 'add_heading_numbering':
        {
          logger.debug('Adding numbering to headings.', { requestId });
          const headingCounters = {};

          visit(tree, 'heading', (node) => {
            const depth = node.depth;
            headingCounters[depth] = (headingCounters[depth] || 0) + 1;
            // Reset counters for deeper levels
            for (let d = depth + 1; d <= 6; d++) {
              headingCounters[d] = 0;
            }
            const numbering = Array.from({ length: depth }, (_, i) => headingCounters[i + 1]).join('.');
            const textNode = node.children.find(child => child.type === 'text');
            if (textNode && !textNode.value.startsWith(`${numbering} `)) {
              textNode.value = `${numbering} ${textNode.value}`;
            }
          });
        }
        break;
      // Add more operation types as needed
      default:
        logger.warn(`Unknown operation type: ${op.type}`, { requestId });
    }
  });
};


// Route to Apply Command to Document
app.post(
  '/apply-command',
  [
    body('command').isString().notEmpty(),
    body('documentContent').isString().notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const { id: requestId } = req;
    logger.debug('Received /apply-command request', { requestId, body: req.body });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { requestId, errors: errors.array() });
      return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
    }

    const { command, documentContent } = req.body;

    // Check if OpenAI API key is missing
    if (!openai) {
      logger.error('OpenAI API key is missing.', { requestId });
      return res.status(500).json({ message: 'Missing OpenAI API key.' });
    }

    const prompt = constructPrompt(command, documentContent);
    logger.debug('Constructed prompt for OpenAI', { requestId, prompt });

    try {
      logger.info('Sending request to OpenAI API', { requestId });
      const chatResponse = await openai.createChatCompletion({
        model: 'gpt-4o', // gpt-4o improves on gpt-4
        messages: [
          { role: 'system', content: 'You are a helpful assistant for restructuring and restyling markdown documents.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0, // Set to 0 for more deterministic output
      });
      logger.info('Received response from OpenAI API', { requestId });

      const aiText = chatResponse.data.choices[0].message.content.trim();
      logger.debug(`AI Response: ${aiText}`, { requestId });

      let operations;
      try {
        operations = JSON.parse(aiText);
        if (!operations.operations || !Array.isArray(operations.operations)) {
          throw new Error('Invalid operations format.');
        }
        logger.debug('Parsed operations from AI response', { requestId, operations });
      } catch (parseError) {
        logger.error('Error parsing AI response as JSON', { requestId, error: parseError.message });
        return res.status(500).json({ message: 'Invalid response format from AI service.' });
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
        logger.warn('Failed to parse YAML front matter.', { requestId, error: yamlError.message });
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
      logger.error('Error communicating with AI service', { requestId, error: error.message, stack: error.stack });
      return res.status(500).json({ message: 'Error communicating with AI service.' });
    }
  })
);

// Helper Function to Read and Process template.md
const getProcessedTemplate = async (requestId) => {
  const templatePath = path.join(__dirname, 'templates', 'template.md');
  
  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    const parsed = parseYAMLFrontMatter(content);
    const config = parsed.config;
    let markdownContent = parsed.markdownContent;

    // Parse the original document content into AST
    const parser = unified().use(remarkParse);
    const tree = parser.parse(markdownContent);
    logger.debug('Parsed template content into AST', { requestId });

    // Apply the operations defined in front matter
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
    logger.debug('Final modified content', { modifiedContent });
    logger.debug('Serialized modified AST back to Markdown', { requestId });

    // Reattach YAML front matter as HTML comments if it was present
    if (Object.keys(config).length > 0) {
      const yamlContent = yaml.dump(config).trim();
      modifiedContent = `<!--\n${yamlContent}\n-->\n\n${modifiedContent}`;
    }

    return modifiedContent;
  } catch (error) {
    logger.error('Error processing template.md', { requestId, error: error.message });
    throw new Error('Failed to process template.');
  }
};

// Route to Serve Processed template.md
app.get('/template', asyncHandler(async (req, res) => {
  const { id: requestId } = req;
  logger.debug('Received /template request', { requestId });

  try {
    const processedTemplate = await getProcessedTemplate(requestId);
    res.setHeader('Content-Type', 'text/markdown');
    res.send(processedTemplate);
  } catch (error) {
    logger.error('Error in /api/template route', { requestId, error: error.message });
    res.status(500).json({ message: 'Failed to retrieve template.' });
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  const { id: requestId } = req;
  logger.error('Unhandled error', { requestId, error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the Server
app.listen(port, () => {
  logger.info(`Server is running on port ${port} NODE_ENV ${process.env.NODE_ENV}`, { requestId: 'system' });
});

export default app; // Add this line to export the Express app