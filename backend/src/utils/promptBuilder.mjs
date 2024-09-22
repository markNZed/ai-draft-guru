// We do not expose the operations generateToc and addHeadingNumbering because they are used internally

export const constructPrompt = (command, documentContent) => {
  return `
You are an assistant that helps restructure and restyle Markdown documents. Given the following command and document content, provide the necessary instructions to modify the document using only the available operations. Be creative and use operations repeatedly if needed to fulfill the command.

**Command**: ${command}
**Document Content**:
${documentContent}

Available operations:
1. change_heading: Change the text of a heading that matches a specific string. This can be used multiple times to modify different headings.
2. emphasize_text: Emphasize specific text by wrapping it with double asterisks. You can also specify the row number to target a specific row using the "rowNumber" parameter, which refers to the row number indicated at the end of the row.

### Important Notes about Row Numbers:
- The row numbers (e.g., [ROW 8]) are technical row numbers and may not match the visual content lines. When applying operations, you should target the text on the specified row number, regardless of where the content appears visually.
- Use the technical row numbers provided at the end of each row to determine which row to modify.
- Do not calculate rows or positions based on the visual appearance of the document content. Trust the provided row numbers.
- For example, if you are asked to modify line 5 then modify the line ending with [ROW 5] not the fifth line from the top.

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

3. If the command is "Emphasize the word 'important' only on row 3", the JSON should look like:

{
  "operations": [
    {
      "type": "emphasize_text",
      "parameters": {
        "text": "important",
        "rowNumber": 3
      }
    }
  ]
}

Only provide the JSON without any additional text. Use only the available operations listed above, applying them creatively and repeatedly if necessary. If the command absolutely cannot be fulfilled using the available operations, return an empty operations array.
`;
};
