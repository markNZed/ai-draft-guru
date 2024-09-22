import { createAudioFromText } from '../../services/openaiTTSService.mjs'; // TTS service
import logger from '../../config/logger.mjs';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

/**
 * Converts the Markdown content (in AST format) into an MP3 using OpenAI's Text-to-Speech API,
 * handling multiple speakers with distinct voices.
 * 
 * @param {object} tree - The Markdown AST.
 * @param {object} parameters - Operation parameters (unused).
 * @param {string} requestId - Unique identifier for the request.
 * @param {object} config - Contains the speaker mapping from the YAML front matter.
 * @returns {Buffer} - The generated MP3 as a Buffer.
 */
export const convertToMp3 = async (tree, parameters, requestId, config) => {
  logger.debug('Starting conversion of Markdown AST to MP3', { requestId });

  // Set ffmpeg path
  ffmpeg.setFfmpegPath(ffmpegPath);

  try {
    // Extract speaker mapping from config
    const speakerMap = new Map(
      config.speaker_map.map(({ Speaker, TTS_Voice }) => [Speaker.toLowerCase(), TTS_Voice.toLowerCase()])
    );

    if (speakerMap.size === 0) {
      throw new Error('Speaker map is missing or empty in the config.');
    }

    // Extract conversation blocks from the AST
    const conversation = extractConversation(tree);

    // Generate audio for each block
    const audioBuffers = [];
    for (const block of conversation) {
      const { speaker, text } = block;
      const voice = speakerMap.get(speaker.toLowerCase());
      if (!voice) {
        throw new Error(`No TTS voice found for speaker: ${speaker}`);
      }

      logger.debug(`Generating audio for speaker: ${speaker} with voice: ${voice}`, { requestId });

      // Generate audio buffer for the text with the specified voice
      const mp3Buffer = await createAudioFromText(text, requestId, voice);
      audioBuffers.push(mp3Buffer);
    }

    // Merge all audio buffers into a single MP3
    const mergedMp3Buffer = await mergeAudioBuffers(audioBuffers, requestId);

    logger.debug('Successfully converted Markdown AST to MP3', { requestId });
    return mergedMp3Buffer;
  } catch (error) {
    logger.error('Error converting Markdown to MP3', { requestId, error: error.message });
    throw error;
  }
};

/**
 * Extracts conversation blocks from the Markdown AST.
 * Each block contains the speaker and their corresponding text.
 * 
 * @param {object} tree - The Markdown AST.
 * @returns {Array} - Array of conversation blocks with speaker and text.
 */
const extractConversation = (tree) => {
  const conversation = [];
  let currentSpeaker = null;
  let currentText = [];

  tree.children.forEach(node => {
    if (node.type === 'paragraph') {
      node.children.forEach(child => {
        if (child.type === 'text') {
          const matchText = child.value.match(/^\[speaker:\s*(.+?)\]\s*(.*)/i);
          if (matchText) {
            const speaker = matchText[1].trim(); // e.g., "Alice"
            const text = matchText[2].trim();    // e.g., "Hi everyone! Welcome to the podcast."
            console.log(`Speaker: ${speaker}`);
            console.log(`Text: ${text}`);
            // Save the previous block
            if (currentSpeaker && currentText.length > 0) {
              conversation.push({
                speaker: currentSpeaker,
                text: currentText.join(' ').trim(),
              });
              currentText = [];
            }
            // Set new speaker
            currentSpeaker = speaker;
            if (text.length > 0) {
              currentText.push(text);
            }
          } else {
            console.log(`currentText.push: ${child.value}`);
            currentText.push(child.value);
          }
        }
      });
    }
  });

  // Push the last block
  if (currentSpeaker && currentText.length > 0) {
    conversation.push({
      speaker: currentSpeaker,
      text: currentText.join(' ').trim(),
    });
  }

  return conversation;
};

/**
 * Merges multiple MP3 buffers into a single MP3 buffer using ffmpeg.
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
