import React, { useState, useCallback, useRef, useEffect } from 'react';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { applyCommand } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [markdownContent, setMarkdownContent] = useState('# Welcome to AI-Assisted Markdown Editor\n\nStart typing your content here...');
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const editorRef = useRef(null);

  useEffect(() => {
    const easyMDE = new EasyMDE({
      element: document.getElementById("markdown-editor"),
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

    easyMDE.codemirror.on('change', () => {
      setMarkdownContent(easyMDE.value());
    });

    return () => {
      easyMDE.toTextArea();
      editorRef.current = null;
    };
  }, []);

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
        editorRef.current.value(response.modifiedContent);
        toast.success('Changes applied successfully!');
        setCommandHistory(prevHistory => [...prevHistory, command]);
        setCommand('');
      } else {
        throw new Error('Invalid response from the server.');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error(`Error applying changes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommandChange = (e) => setCommand(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      applyChanges();
    }
  };

  const reapplyCommand = (oldCommand) => {
    setCommand(oldCommand);
    applyChanges();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Assisted Markdown Document Editor</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <textarea id="markdown-editor" />
        </div>
        <div className="w-full md:w-1/3">
          <Tabs defaultValue="command">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="command">Command</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="command">
              <Textarea
                placeholder="Enter your command here..."
                value={command}
                onChange={handleCommandChange}
                onKeyDown={handleKeyDown}
                className="mb-4"
                disabled={isLoading}
              />
              <Button onClick={applyChanges} disabled={isLoading}>
                {isLoading ? 'Applying...' : 'Apply Changes'}
              </Button>
              {commandHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Command History:</h3>
                  <ul className="list-disc pl-5">
                    {commandHistory.map((cmd, index) => (
                      <li key={index} className="mb-1">
                        <button
                          onClick={() => reapplyCommand(cmd)}
                          className="text-blue-500 hover:underline"
                        >
                          {cmd}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownContent }} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
