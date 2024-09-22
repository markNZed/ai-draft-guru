import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { convertMarkdownToText } from '../markdownUtils.mjs'; // A helper to convert Markdown to plain text
import { createAudioFromText } from '../../services/openaiTTSService.mjs'; // TTS service
import logger from '../../config/logger.mjs';

/**
 * Converts the Markdown content into an MP3 using OpenAI's Text-to-Speech API.
 * 
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters (unused).
 * @param {string} requestId - Unique identifier for the request.
 * @returns {Buffer} - The generated MP3 as a Buffer.
 */
export const convertToMp3 = async (tree, parameters, requestId) => {
  logger.debug('Starting conversion of Markdown to MP3', { requestId });

  try {
    // Convert Markdown AST to plain text
    const processor = unified().use(remarkParse);
    const plainText = convertMarkdownToText(tree); // Ensure you have a utility that converts AST to text

    // Call the OpenAI TTS service to generate MP3
    const mp3Buffer = await createAudioFromText(plainText, requestId);

    logger.debug('Successfully converted Markdown to MP3', { requestId });
    return mp3Buffer;
  } catch (error) {
    logger.error('Error converting Markdown to MP3', { requestId, error: error.message });
    throw error;
  }
};
