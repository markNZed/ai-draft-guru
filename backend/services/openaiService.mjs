// backend/services/openaiService.mjs

import { Configuration, OpenAIApi } from 'openai';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';

let openai = null;

if (config.openAiApiKey) {
  const configuration = new Configuration({
    apiKey: config.openAiApiKey,
  });
  openai = new OpenAIApi(configuration);
  logger.info('OpenAI API initialized.', { requestId: 'system' });
} else {
  logger.error('OPENAI_API_KEY is not set in the environment variables.', {
    requestId: 'system',
  });
}

export const createChatCompletion = async (messages, requestId) => {
  if (!openai) {
    throw new Error('OpenAI API key is missing.');
  }

  try {
    logger.info('Sending request to OpenAI API', { requestId });
    const chatResponse = await openai.createChatCompletion({
      model: 'gpt-4o', // gpt-4o improves on gpt-4
      messages,
      max_tokens: 500,
      temperature: 0, // Set to 0 for more deterministic output
    });
    logger.info('Received response from OpenAI API', { requestId });

    return chatResponse.data.choices[0].message.content.trim();
  } catch (error) {
    logger.error('Error communicating with OpenAI API', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
