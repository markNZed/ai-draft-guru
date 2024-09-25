// frontend/src/lib/api.js

import axios from 'axios';

// Define the apiClient instance using axios
const apiClient = axios.create({
  baseURL: '/api', // Use the relative path for API routes
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Applies a command to a specific file within a project.
 * 
 * @param {string} command - The user command.
 * @param {string} typeToSend - The type of command ('predefined', 'free-form', etc.).
 * @param {string} projectName - The ID of the project.
 * @param {string} fileName - The ID of the file.
 * @returns {object} - The response data from the backend.
 */
export const applyCommand = async (command, typeToSend, projectName, fileName, content) => {
  try {
    const response = await apiClient.post(
      `/apply-command/${projectName}/${fileName}`, // Updated endpoint as per API.md
      { 
        command, 
        type: typeToSend,
        content,
      },
      {
        responseType: 'blob', // Use 'blob' to handle binary data
      }
    );

    // Get the content type from headers
    const contentType = response.headers['content-type'];

    if (contentType.includes('application/json')) {
      // If response is JSON, parse it
      const reader = new FileReader();
      const text = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(response.data);
      });
      const data = JSON.parse(text);
      data.isJSON = true;
      return data;
    } else {
      return response;
    }
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
