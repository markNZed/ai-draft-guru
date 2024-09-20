// src/lib/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Use relative path
  headers: {
    'Content-Type': 'application/json',
  },
});

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
