import React, { useState, useRef, useEffect } from 'react';
import { initializeEasyMDE, destroyEasyMDE, getEasyMDEInstance } from './easyMDEManager'; // Adjust the path accordingly
import 'easymde/dist/easymde.min.css';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { applyCommand } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const Index = () => {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const markdownContentRef = useRef(''); // To hold the current markdown content
  const editorContainerRef = useRef(null); // Ref to the textarea container

  // Function to fetch the markdown template with cache busting
  const fetchMarkdownTemplate = async () => {
    try {
      const response = await fetch('/api/template', {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const templateContent = await response.text();
      return templateContent;
    } catch (error) {
      console.error('Error fetching markdown template:', error);
      toast.error('Failed to load the markdown template.');
      return null;
    }
  };

  // Initialize EasyMDE on component mount
  useEffect(() => {
    const initializeEditor = async () => {
      const templateContent = await fetchMarkdownTemplate();
      if (templateContent === null) {
        return; // Do not initialize editor if fetching failed
      }

      markdownContentRef.current = templateContent;

      // Initialize EasyMDE or update the existing instance
      const easyMDE = initializeEasyMDE(editorContainerRef.current, templateContent);

      // Set up change handler if not already set
      if (!easyMDE.isChangeHandlerSet) {
        easyMDE.codemirror.on('change', () => {
          markdownContentRef.current = easyMDE.value();
        });
        easyMDE.isChangeHandlerSet = true; // Custom flag to prevent multiple handlers
      }
    };

    initializeEditor();

    // Cleanup on unmount
    return () => {
      // Optional: Destroy the editor if you want it to be re-initialized on next mount
      // destroyEasyMDE();
    };
  }, []);

  const applyChanges = async () => {
    if (!command.trim()) {
      toast.error('Please enter a command before applying changes.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await applyCommand(command, markdownContentRef.current);
      if (response && response.modifiedContent) {
        markdownContentRef.current = response.modifiedContent;
        const easyMDE = getEasyMDEInstance();
        if (easyMDE) {
          easyMDE.value(response.modifiedContent);
        }
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

  // Function to clear local storage and reset the editor content
  const clearLocalStorage = async () => {
    try {
      localStorage.removeItem("smde_markdown-editor"); // Clear the local storage key used by EasyMDE
      const templateContent = await fetchMarkdownTemplate();
      if (templateContent === null) {
        return; // Do not proceed if fetching failed
      }
      markdownContentRef.current = templateContent;
      const easyMDE = getEasyMDEInstance();
      if (easyMDE) {
        easyMDE.value(templateContent); // Update the editor's content
      }
      toast.success('Local storage cleared and editor reset to template!');
    } catch (error) {
      console.error('Error clearing storage and resetting editor:', error);
      toast.error('Failed to reset the editor.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Assisted Markdown Document Editor</h1>
      <div className="flex flex-col md:flex-row gap-4">
        {/* The @tailwindcss/typography plugin provides a prose class, which gives you pre-styled typography for headings, paragraphs, lists, blockquotes, etc. */}
        <div className="w-full md:w-2/3 prose"> 
          {/* Assign the ref to the textarea */}
          <textarea ref={editorContainerRef} id="markdown-editor" />
        </div>
        <div className="w-full md:w-1/3">
          <Tabs defaultValue="command">
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
              {/* Clear Storage & Reset Editor Button */}
              <Button onClick={clearLocalStorage} className="mt-4">
                Clear Storage & Reset Editor
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
