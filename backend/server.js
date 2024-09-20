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

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware Setup

// HTTP request logging
app.use(morgan('combined'));

// Enable CORS for specific origins
/*
app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));
*/
app.use(cors());


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

// POST /apply-command Endpoint with Validation
app.post(
    '/apply-command',
    [
      body('command').isString().notEmpty(),
      body('documentContent').isString().notEmpty(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
      }
  
      const { command, documentContent } = req.body;
  
      // Check if OpenAI API key is missing
      if (!openai) {
        // Return dummy response if API key is not set
        const dummyResponse = {
          operations: [
            {
              type: 'change_heading',
              parameters: {
                match: 'Introduction',
                newLevel: 2,
              },
            },
            {
              type: 'emphasize_text',
              parameters: {
                text: 'important',
              },
            },
          ],
        };
  
        // Parse the document and apply the dummy operations
        const processor = unified().use(remarkParse).use(remarkStringify);
        let tree = processor.parse(documentContent);
        applyOperations(tree, dummyResponse.operations);
        const modifiedContent = processor.stringify(tree);
  
        return res.json({ modifiedContent, message: 'Dummy result because OPENAI_API_KEY is not set' });
      }
  
      // Original logic to handle OpenAI API call
      const prompt = constructPrompt(command, documentContent);
      try {
        const aiResponse = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.2,
        });
  
        const aiText = aiResponse.data.choices[0].text.trim();
        const instructions = JSON.parse(aiText);
  
        if (!instructions.operations || !Array.isArray(instructions.operations)) {
          return res.status(500).json({ message: 'AI response does not contain a valid "operations" array.' });
        }
  
        const processor = unified().use(remarkParse).use(remarkStringify);
        let tree = processor.parse(documentContent);
        applyOperations(tree, instructions.operations);
        const modifiedContent = processor.stringify(tree);
  
        return res.json({ modifiedContent, message: 'Success' });
      } catch (error) {
        return res.status(500).json({ message: 'Error communicating with AI service.' });
      }
    }
);

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
