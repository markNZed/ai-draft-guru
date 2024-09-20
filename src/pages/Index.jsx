// src/pages/Index.jsx
import React, { useEffect, useRef, useState } from 'react';
import EasyMDE from 'easymde'; // Import EasyMDE
import 'easymde/dist/easymde.min.css'; // Import EasyMDE's CSS
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { applyCommand } from '@/lib/api';

const Index = () => {
  const [markdownContent, setMarkdownContent] = useState('# Welcome to AI-Assisted Markdown Editor\n\nStart typing your content here...');
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null); // To hold the EasyMDE instance

  // Initialize EasyMDE once the component mounts
  useEffect(() => {
    const easyMDE = new EasyMDE({
      element: document.getElementById("markdown-editor"), // Use the textarea element
      initialValue: markdownContent,
      autosave: {
        enabled: true,
        delay: 1000,
        uniqueId: "markdown-editor",
      },
      placeholder: "Type your Markdown here...",
      spellChecker: false,
    });

    editorRef.current = easyMDE;

    // Handle updates to the markdown content when the editor changes
    easyMDE.codemirror.on('change', () => {
      setMarkdownContent(easyMDE.value());
    });

    return () => {
      // Cleanup on unmount
      easyMDE.toTextArea(); // Revert to the normal textarea
      editorRef.current = null;
    };
  }, []);

  // Apply changes to the Markdown document using the command
  const applyChanges = async () => {
    if (!command.trim()) {
      toast.error('Please enter a command before applying changes.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await applyCommand(command, markdownContent);
      if (response && response.modifiedContent) {
        setMarkdownContent(response.modifiedContent);
        editorRef.current.value(response.modifiedContent); // Update the editor with the new content
        toast.success('Changes applied successfully!');
        setCommand(''); // Clear the command input after applying
      } else {
        throw new Error('Invalid response from the server.');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Error applying changes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Assisted Markdown Document Editor</h1>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Markdown Editor */}
        <div className="w-full md:w-2/3">
          <textarea id="markdown-editor" /> {/* EasyMDE binds to this textarea */}
        </div>

        {/* Command Input and Apply Button */}
        <div className="w-full md:w-1/3 flex flex-col">
          <Textarea
            placeholder="Enter your command here..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="mb-4"
            disabled={isLoading}
          />
          <Button onClick={applyChanges} disabled={isLoading}>
            {isLoading ? 'Applying...' : 'Apply Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
