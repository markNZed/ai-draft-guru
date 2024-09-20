// backend/server.js

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
import morgan from 'morgan';
import winston from 'winston';
import asyncHandler from 'express-async-handler';


// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // Add file transports if needed
  ],
});


// Middleware Setup

// HTTP request logging
app.use(morgan('combined'));

// Enable CORS for specific origins
const allowedOrigins = ['http://localhost:8080', 'https://gptengineer.app'];

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});


// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
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

// Helper Function to Apply Operations to AST
const applyOperations = (tree, operations) => {
  operations.forEach(op => {
    switch (op.type) {
      case 'change_heading':
        {
          const { match, newLevel } = op.parameters;
          visit(tree, 'heading', (node) => {
            if (node.children && node.children[0] && node.children[0].value === match) {
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
              node.value = node.value.replace(new RegExp(text, 'g'), `**${text}**`);
            }
          });
        }
        break;
      // Add more operation types as needed
      default:
        console.warn(`Unknown operation type: ${op.type}`);
    }
  });
};


// Inside the /apply-command route
app.post(
  '/apply-command',
  [
    body('command').isString().notEmpty(),
    body('documentContent').isString().notEmpty(),
  ],
  asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
      }
  
      const { command, documentContent } = req.body;
  
      // Check if OpenAI API key is missing
      if (!openai) {
        return res.status(500).json({ message: 'Missing OpenAI API key.' });
      }
  
      const prompt = `Command: ${command}\nDocument Content:\n${documentContent}`;
  
      try {
        const chatResponse = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo', // or gpt-4 if you have access
          messages: [
            { role: 'system', content: 'You are a helpful assistant for restructuring and restyling markdown documents.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
        });
  
        const aiText = chatResponse.data.choices[0].message.content;
        logger.info(`aiText ${aiText}`);
        res.json({ modifiedContent: aiText, message: 'Success' });
      } catch (error) {
        logger.error('Error communicating with AI service:', error);
        return res.status(500).json({ message: 'Error communicating with AI service.' });
      }
    }
  )
);


// Start the Server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
