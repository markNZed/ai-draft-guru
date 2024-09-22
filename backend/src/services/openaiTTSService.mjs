import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../config/logger.mjs';
import { config } from '../config/index.mjs';
import { OpenAI } from 'openai';
import { PassThrough, Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg'; // Assumes fluent-ffmpeg is used for ffmpeg bindings

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
 * Splits the input text into chunks not exceeding the specified maximum length.
 * It attempts to split at sentence boundaries to maintain coherence.
 *
 * @param {string} text - The input text to split.
 * @param {number} maxLength - The maximum length of each chunk.
 * @returns {string[]} - An array of text chunks.
 */
const splitTextIntoChunks = (text, maxLength = 4096) => {
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If single sentence exceeds maxLength, split it forcibly
      if (sentence.length > maxLength) {
        const parts = sentence.match(new RegExp(`.{1,${maxLength}}`, 'g'));
        chunks.push(...parts);
      } else {
        currentChunk += sentence;
      }
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Merges multiple MP3 buffers into a single MP3 buffer using ffmpeg in-memory.
 * 
 * @param {Array<Buffer>} buffers - Array of MP3 buffers.
 * @param {string} requestId - Unique identifier for the request.
 * @returns {Promise<Buffer>} - The merged MP3 as a Buffer.
 */
const mergeAudioBuffers = (buffers, requestId) => {
  return new Promise((resolve, reject) => {
    logger.debug('Starting audio merging process', { requestId });

    const mergedStream = new PassThrough();
    const bufferStream = new Readable({
      read() {
        this.push(Buffer.concat(buffers));
        this.push(null);
      }
    });

    const ffmpegCommand = ffmpeg()
      .input(bufferStream) // Pipe the readable buffer stream into ffmpeg
      .inputFormat('mp3')
      .on('error', (err) => {
        logger.error('ffmpeg error during merging', { requestId, error: err.message });
        reject(err);
      })
      .on('end', () => {
        logger.debug('Audio merging completed', { requestId });
      })
      .format('mp3');

    const chunks = [];
    mergedStream.on('data', chunk => chunks.push(chunk));
    mergedStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    mergedStream.on('error', (err) => {
      logger.error('Error during audio stream', { requestId, error: err.message });
      reject(err);
    });

    ffmpegCommand.pipe(mergedStream, { end: true });
  });
};

/**
 * Converts text to MP3 using OpenAI's Text-to-Speech (TTS) API with caching.
 * Handles texts longer than 4096 characters by splitting them into smaller chunks.
 *
 * @param {string} text - The plain text to convert to speech.
 * @param {string} requestId - The request ID for logging.
 * @param {string} voice - The voice to use for TTS.
 * @returns {Buffer} - The concatenated MP3 buffer.
 */
export const createAudioFromText = async (text, requestId, voice) => {
  try {
    logger.info('Processing TTS request.', { requestId });

    // Split text into chunks if necessary
    const chunks = splitTextIntoChunks(text, 4096);
    logger.info(`Text split into ${chunks.length} chunk(s).`, { requestId });

    const audioBuffers = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkHash = hashText(chunk + voice);
      const cachedFilePath = path.join(CACHE_DIR, `${chunkHash}.mp3`);

      // Check if the audio chunk is already cached
      if (fs.existsSync(cachedFilePath)) {
        logger.info(`Cache hit for chunk ${i + 1}/${chunks.length} with hash ${chunkHash}.`, { requestId });
        const cachedBuffer = await fs.promises.readFile(cachedFilePath);
        audioBuffers.push(cachedBuffer);
      } else {
        logger.info(`Cache miss for chunk ${i + 1}/${chunks.length}. Requesting TTS from OpenAI.`, { requestId });

        // Make the API request to generate speech
        const mp3Response = await openai.audio.speech.create({
          model: 'tts-1',          // TTS model
          voice: voice.toLowerCase(), // Use any other supported voice as needed
          input: chunk,            // The text chunk to convert to speech
        });

        // Convert the response to a buffer
        const buffer = Buffer.from(await mp3Response.arrayBuffer());

        // Save the MP3 chunk to the cache
        await fs.promises.writeFile(cachedFilePath, buffer);
        logger.info(`MP3 chunk saved to cache at ${cachedFilePath}`, { requestId });

        audioBuffers.push(buffer);
      }
    }

    // Merge all audio buffers using ffmpeg
    const combinedBuffer = await mergeAudioBuffers(audioBuffers, requestId);
    logger.info('All audio chunks merged successfully.', { requestId });

    return combinedBuffer; // Return the combined buffer for further processing
  } catch (error) {
    logger.error('Error in OpenAI TTS request', { requestId, error: error.message });
    throw new Error('Failed to generate MP3 from text.');
  }
};
