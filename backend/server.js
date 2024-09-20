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

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(morgan('combined'));
app.use(cors());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests from this IP, please try again after a minute',
});

app.use(limiter);
app.use(express.json());

let openai;

if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}

const constructPrompt = (command, documentContent) => `
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
  ]
}

Only provide the JSON without any additional text.
`;

const applyOperations = (tree, operations) => {
  operations.forEach(op => {
    switch (op.type) {
      case 'change_heading':
        visit(tree, 'heading', (node) => {
          if (node.children && node.children[0] && node.children[0].value === op.parameters.match) {
            node.depth = op.parameters.newLevel;
          }
        });
        break;
      case 'emphasize_text':
        visit(tree, 'text', (node) => {
          if (node.value.includes(op.parameters.text)) {
            node.value = node.value.replace(new RegExp(op.parameters.text, 'g'), `**${op.parameters.text}**`);
          }
        });
        break;
      default:
        console.warn(`Unknown operation type: ${op.type}`);
    }
  });
};

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

    if (!openai) {
      const dummyResponse = {
        operations: [
          { type: 'change_heading', parameters: { match: 'Introduction', newLevel: 2 } },
          { type: 'emphasize_text', parameters: { text: 'important' } },
        ],
      };

      const processor = unified().use(remarkParse).use(remarkStringify);
      let tree = processor.parse(documentContent);
      applyOperations(tree, dummyResponse.operations);
      const modifiedContent = processor.stringify(tree);

      return res.json({ modifiedContent, message: 'Dummy result because OPENAI_API_KEY is not set' });
    }

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
