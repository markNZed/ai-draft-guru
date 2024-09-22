// backend/services/openaiService.mjs

import { OpenAI } from 'openai';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Initialize OpenAI
let openai = null;

if (config.openAiApiKey) {
  openai = new OpenAI({
    apiKey: config.openAiApiKey
  });
  logger.info('OpenAI API initialized.', { requestId: 'system' });
} else {
  logger.error('OPENAI_API_KEY is not set in the environment variables.', {
    requestId: 'system',
  });
}

// Configure LRUCache Cache
const cacheOptions = {
  max: 500, // Maximum number of items in cache
  ttl: 1000 * 60 * 60, // Time to live: 1 hour
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

const cache = new LRUCache(cacheOptions);

/**
 * Generates a unique cache key based on the messages.
 * @param {Array} messages - The array of message objects.
 * @returns {string} - A hashed string representing the cache key.
 */
const generateCacheKey = (messages) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(messages));
  return hash.digest('hex');
};

/**
 * Creates a chat completion using OpenAI's API with caching.
 * @param {Array} messages - The array of message objects.
 * @param {string} requestId - The unique request identifier for logging.
 * @returns {Promise<string>} - The generated chat completion.
 */
export const createChatCompletion = async (messages, requestId) => {
  if (!openai) {
    throw new Error('OpenAI API key is missing.');
  } 

  const cacheKey = generateCacheKey(messages);

  // Check if the response is in the cache
  if (cache.has(cacheKey)) {
    const cachedResponse = cache.get(cacheKey);
    logger.info('Cache hit for OpenAI API request.', { requestId });
    return cachedResponse;
  }

  // If not cached, make the API request
  try {
    logger.info('Cache miss. Sending request to OpenAI API.', { requestId });
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0, // Set to 0 for more deterministic output
    });
    const responseContent = chatCompletion.choices[0].message.content.trim();

    // Store the response in the cache
    cache.set(cacheKey, responseContent);
    logger.info('Received and cached response from OpenAI API.', { requestId });
    return responseContent;
  } catch (error) {
    logger.error('Error communicating with OpenAI API', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
