import axios from 'axios';

const API_BASE_URL = '/api';

export const applyCommand = async (command, documentContent) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/apply-command`, {
      command,
      documentContent
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'An error occurred while processing the command');
  }
};