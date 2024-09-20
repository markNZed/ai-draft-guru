// src/lib/api.js
import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Applies a user command to the document content by sending a request to the backend.
 *
 * @param {string} command - The user's command for restructuring or restyling.
 * @param {string} documentContent - The current Markdown content of the document.
 * @returns {Promise<Object>} The response data containing the modified content.
 * @throws {Error} If the request fails or the backend returns an error.
 */
export const applyCommand = async (command, documentContent) => {
  try {
    const response = await apiClient.post('/apply-command', {
      command,
      documentContent,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An error occurred while processing the command';
    throw new Error(message);
  }
};
