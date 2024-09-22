// We do not expose the operations generateToc and addHeadingNumbering because they are used internally

export const constructPrompt = (command, documentContent) => {
  return `
You are an assistant that helps restructure and restyle Markdown documents. Given the following command and document content, provide the necessary instructions to modify the document using only the available operations. Be creative and use operations repeatedly if needed to fulfill the command.

**Command**: ${command}
**Document Content**:
${documentContent}

Available operations:
1. change_heading: Change the text of a heading that matches a specific string. This can be used multiple times to modify different headings.
2. emphasize_text: Emphasize specific text by wrapping it with double asterisks. You can also specify the line number to target a specific line using the "lineNumber" parameter, which refers to the line number indicated at the end of the line.
3. convert_to_doc: Convert the entire Markdown document to a Microsoft Word (.docx) file. This operation does not take additional parameters.

### Important Notes about line Numbers:
- The line numbers (e.g., [LINE 8]) are technical line numbers and may not match the visual content lines. When applying operations, you should target the text on the specified line number, regardless of where the content appears visually.
- Use the technical line numbers provided at the end of each line to determine which line the operation should modify.

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

1. If the command is "Change the heading 'Introduction' to 'Overview' and add '-Updated' to all other headings", the JSON should look like:

{
  "operations": [
    {
      "type": "change_heading",
      "parameters": {
        "match": "Introduction",
        "newText": "Overview"
      }
    },
    {
      "type": "change_heading",
      "parameters": {
        "match": "Features",
        "newText": "Features-Updated"
      }
    },
    {
      "type": "change_heading",
      "parameters": {
        "match": "Getting Started",
        "newText": "Getting Started-Updated"
      }
    }
    // ... and so on for other headings
  ]
}

2. If the command is "Emphasize the words 'important' and 'crucial' across the document", the JSON should look like:

{
  "operations": [
    {
      "type": "emphasize_text",
      "parameters": {
        "text": "important"
      }
    },
    {
      "type": "emphasize_text",
      "parameters": {
        "text": "crucial"
      }
    }
  ]
}

3. If the command is "Emphasize the word 'important' only on line 3", the JSON should look like:

{
  "operations": [
    {
      "type": "emphasize_text",
      "parameters": {
        "text": "important",
        "lineNumber": 3
      }
    }
  ]
}

Only provide the JSON without any additional text. Use only the available operations listed above, applying them creatively and repeatedly if necessary. If the command absolutely cannot be fulfilled using the available operations, return an empty operations array.
`;
};
