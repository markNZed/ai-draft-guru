export const constructPrompt = (command, documentContent) => {
  return `
You are an assistant that helps restructure and restyle Markdown documents. Given the following command and document content, provide the necessary instructions to modify the document using only the available operations. Be creative and use operations repeatedly if needed to fulfill the command.

**Command**: ${command}
**Document Content**:
${documentContent}

Available operations:
1. add_heading_numbering: Add numbering to all headings based on their depth.
2. change_heading: Change the text of a heading that matches a specific string. This can be used multiple times to modify different headings.
3. emphasize_text: Emphasize specific text by wrapping it with double asterisks.
4. generate_toc: Generate a Table of Contents for the document.

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

**Examples:**

1. If the command is "Add numbering to all headings", the JSON should look like:

{
"operations": [
  {
    "type": "add_heading_numbering",
    "parameters": {}
  }
]
}

2. If the command is "Change the heading 'Introduction' to 'Overview' and add '-Updated' to all other headings", the JSON should look like:

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

3. If the command is "Emphasize the words 'important' and 'crucial'", the JSON should look like:

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

4. If the command is "Generate a table of contents and add '-Section' to all main headings", the JSON should look like:

{
"operations": [
  {
    "type": "generate_toc",
    "parameters": {}
  },
  {
    "type": "change_heading",
    "parameters": {
      "match": "Introduction",
      "newText": "Introduction-Section"
    }
  },
  {
    "type": "change_heading",
    "parameters": {
      "match": "Features",
      "newText": "Features-Section"
    }
  }
  // ... and so on for other main headings
]
}

Only provide the JSON without any additional text. Use only the available operations listed above, applying them creatively and repeatedly if necessary. If the command absolutely cannot be fulfilled using the available operations, return an empty operations array.
`;
};