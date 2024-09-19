import React, { useState, useCallback, useRef } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import "easymde/dist/easymde.min.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from 'axios';

const Index = () => {
  const [markdownContent, setMarkdownContent] = useState('# Welcome to AI-Assisted Markdown Editor\n\nStart typing your content here...');
  const [command, setCommand] = useState('');
  const commandInputRef = useRef(null);
  const editorRef = useRef(null);

  const handleEditorChange = useCallback((value) => {
    setMarkdownContent(value);
  }, []);

  const handleCommandChange = (event) => {
    setCommand(event.target.value);
  };

  const applyChanges = async () => {
    if (!command.trim()) {
      toast.error('Please enter a command before applying changes.');
      return;
    }

    try {
      const response = await axios.post('/api/apply-command', {
        command,
        documentContent: markdownContent
      });
      setMarkdownContent(response.data.modifiedContent);
      toast.success('Changes applied successfully!');
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Error applying changes: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCommandKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      editorRef.current?.focus();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Assisted Markdown Document Editor</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <SimpleMDE
            value={markdownContent}
            onChange={handleEditorChange}
            options={{
              spellChecker: false,
              placeholder: "Type your Markdown here...",
              autofocus: false,
              autosave: {
                enabled: true,
                delay: 1000,
                uniqueId: "markdown-editor"
              },
              status: false,
            }}
            ref={editorRef}
          />
        </div>
        <div className="w-full md:w-1/3">
          <Textarea
            placeholder="Enter your command here..."
            value={command}
            onChange={handleCommandChange}
            onKeyDown={handleCommandKeyDown}
            ref={commandInputRef}
            className="mb-4"
          />
          <Button onClick={applyChanges}>Apply Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
