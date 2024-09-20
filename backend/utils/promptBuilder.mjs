// backend/utils/promptBuilder.mjs

export const constructPrompt = (command, documentContent) => {
    return `
  You are an assistant that helps restructure and restyle Markdown documents. Given the following command and document content, provide the necessary instructions to modify the document.
  
  **Command**: ${command}
  **Document Content**:
  ${documentContent}
  
  Provide the instructions in the following JSON format:
  
  {
    "operations": [
      {
        "type": "operation_type",
        "parameters": { ... }
      }
      // Add more operations as needed
    ]
  }
  
  **Example:**
  
  If the command is "Change all first-level headings to second-level and emphasize the word 'important'", the JSON should look like:
  
  {
    "operations": [
      {
        "type": "change_heading",
        "parameters": {
          "match": "Introduction",
          "newLevel": 2
        }
      },
      {
        "type": "emphasize_text",
        "parameters": {
          "text": "important"
        }
      }
    ]
  }
  
  Only provide the JSON without any additional text.
  `;
  };
  