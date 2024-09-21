// frontend/src/lib/api.js

import axios from 'axios';

// Define the apiClient instance using axios
const apiClient = axios.create({
  baseURL: '/api', // Use the relative path for API routes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define the applyCommand function
export const applyCommand = async (command, documentContent) => {
  try {
    const response = await apiClient.post('/apply-command', {
      command,
      documentContent,
    });
    return response.data;
  } catch (error) {
    // Capture the error message and propagate it
    const message =
      error.response?.data?.message ||
      error.message ||
      'An error occurred while processing the command';
    throw new Error(message);
  }
};

export default apiClient; // Ensure apiClient is exported if needed elsewhere
