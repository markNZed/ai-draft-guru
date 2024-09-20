import axios from 'axios';

const API_BASE_URL = 'https://lov-p-f8912158-55fd-46fa-a5ff-93addfd5645f.fly.dev/api';

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
    console.log('Sending request to:', `${API_BASE_URL}/apply-command`);
    console.log('Request payload:', { command, documentContent });
    
    const response = await apiClient.post('/apply-command', {
      command,
      documentContent,
    });
    
    console.log('Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in applyCommand:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server responded with error:', error.response.status, error.response.data);
      throw new Error(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw new Error('No response received from server. Please check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up the request:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};
