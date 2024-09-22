import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';
import { OpenAI } from 'openai';

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

// Define cache directory
const CACHE_DIR = path.resolve('./tts-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  logger.info(`Cache directory created at ${CACHE_DIR}`, { requestId: 'system' });
}

/**
 * Generates a SHA-256 hash for the given text.
 *
 * @param {string} text - The input text to hash.
 * @returns {string} - The resulting hash in hexadecimal format.
 */
const hashText = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Converts text to MP3 using OpenAI's Text-to-Speech (TTS) API with caching.
 *
 * @param {string} text - The plain text to convert to speech.
 * @param {string} requestId - The request ID for logging.
 * @returns {Buffer} - The MP3 buffer.
 */
export const createAudioFromText = async (text, requestId) => {
  try {
    logger.info('Processing TTS request.', { requestId });

    // Generate a unique filename based on the text
    const textHash = hashText(text);
    const cachedFilePath = path.join(CACHE_DIR, `${textHash}.mp3`);

    // Check if the audio is already cached
    if (fs.existsSync(cachedFilePath)) {
      logger.info(`Cache hit for text hash ${textHash}. Retrieving from cache.`, { requestId });
      const cachedBuffer = await fs.promises.readFile(cachedFilePath);
      return cachedBuffer;
    }

    logger.info('Cache miss. Requesting TTS from OpenAI.', { requestId });

    // Make the API request to generate speech
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',    // TTS model
      voice: 'alloy',    // Use any other supported voice as needed
      input: text,       // The text to convert to speech
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Save the MP3 to the cache
    await fs.promises.writeFile(cachedFilePath, buffer);
    logger.info(`MP3 saved to cache at ${cachedFilePath}`, { requestId });

    return buffer; // Return the buffer for further processing (e.g., sending in the HTTP response)
  } catch (error) {
    logger.error('Error in OpenAI TTS request', { requestId, error: error.message });
    throw new Error('Failed to generate MP3 from text.');
  }
};
