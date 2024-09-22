// backend/utils/frontMatterParser.mjs

import yaml from 'js-yaml';

export const parseYAMLFrontMatter = (content) => {
  // Regex to match an HTML comment-based front matter block
  const htmlCommentRegex = /^<!--([\s\S]*?)\n-->([\s\S]*)$/;
  const match = content.match(htmlCommentRegex);

  if (match) {
    let yamlContent = match[1]; // The YAML-like configuration inside the comment
    const markdownContent = match[2]; // The remaining markdown content
    try {
      const config = yaml.load(yamlContent); // Parse the config from YAML format
      return { config, markdownContent };
    } catch (error) {
      throw new Error('Invalid YAML front matter inside HTML comment.');
    }
  }

  // Fallback to regular YAML front matter parsing if no HTML comment is found
  const yamlRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const yamlMatch = content.match(yamlRegex);

  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    const markdownContent = yamlMatch[2];
    try {
      const config = yaml.load(yamlContent);
      return { config, markdownContent };
    } catch (error) {
      throw new Error('Invalid YAML front matter.');
    }
  }

  return { config: {}, markdownContent: content }; // No front matter found
};
