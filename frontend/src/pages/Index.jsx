// frontend/src/pages/Index.jsx

import React, { useState, useRef, useEffect } from 'react';
import { initializeEasyMDE, destroyEasyMDE, getEasyMDEInstance } from './easyMDEManager'; // Adjust the path accordingly
import 'easymde/dist/easymde.min.css';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { applyCommand } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Ensure these are imported correctly
import { Diff, Hunk, parseDiff } from 'react-diff-view'; // Ensure react-diff-view is installed
import 'react-diff-view/style/index.css'; // Import react-diff-view styles
import { diffLines, formatLines } from 'unidiff'; // Import unidiff
import { remark } from 'remark';
import remarkStringify from 'remark-stringify';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';

// Define the fetchMarkdownTemplate function
const fetchMarkdownTemplate = async (templateName = 'default') => { // Accept a templateName parameter with 'default' as fallback
  try {
    const response = await fetch(`/api/template?name=${encodeURIComponent(templateName)}`, { // Pass the templateName as a query parameter
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

const createUnifiedDiff = (original, modified) => {
  const diffText = formatLines(diffLines(original, modified), { context: 3 });
  const [parsedDiff] = parseDiff(diffText, { nearbySequences: 'zip' });
  return parsedDiff;
};

// Function to render the diff with hunks
const renderDiff = (current, proposed) => {
  const parsedDiff = createUnifiedDiff(current, proposed);

  console.log("Generated Diff:", parsedDiff); // Debugging

  // Handle cases where there are no hunks
  if (!parsedDiff || !parsedDiff.hunks || parsedDiff.hunks.length === 0) {
    console.error("No hunks found in the parsed diff.");
    return <div>No changes detected.</div>;
  }

  // Render the diff with context using Diff and Hunk components
  return (
    <Diff viewType="split" diffType="modify" hunks={parsedDiff.hunks}>
      {(hunks) =>
        hunks.map((hunk) => (
          <Hunk key={hunk.content} hunk={hunk} />
        ))
      }
    </Diff>
  );
};

const Index = () => {
  // Separate state variables for each command type
  const [predefinedCommand, setPredefinedCommand] = useState('');
  const [freeFormCommand, setFreeFormCommand] = useState('');
  const [scriptCommand, setScriptCommand] = useState('');
  const [scriptGenCommand, setScriptGenCommand] = useState('');

  const [activeCommandType, setActiveCommandType] = useState('predefined'); // Track active tab
  const [isLoading, setIsLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [proposedContent, setProposedContent] = useState(null); // State to track proposed changes
  const [currentContent, setCurrentContent] = useState(''); // State to track current content
  const [versions, setVersions] = useState([]); // State to track versions
  const [undoStack, setUndoStack] = useState([]); // State to track undo stack
  const markdownContentRef = useRef(''); 
  const editorContainerRef = useRef(null); // Ref to the textarea container

  const LOCAL_STORAGE_KEY_VERSIONS = "smde_markdown_versions";
  const LOCAL_STORAGE_KEY_UNDO = "smde_markdown_undo";

  const [selectedTemplate, setSelectedTemplate] = useState('default'); // New state for selected template
  const [availableTemplates, setAvailableTemplates] = useState([]); // New state for template list

  const [ast, setAST] = useState(null); // State to track the parsed AST

  const scriptTextareaRef = useRef(null); // Ref for the script Textarea

  // Initialize CodeMirror extensions
  const extensions = [
    javascript({ jsx: true }),
    // Add other extensions as needed
  ];

  // Function to parse markdown to AST using Remark
  const parseMarkdownToAST = (markdown) => {
    const parsedAST = remark().parse(markdown);
    setAST(parsedAST);
    return parsedAST;
  };

  // Function to stringify AST back to markdown
  const stringifyASTToMarkdown = (ast) => {
    return remark().use(remarkStringify, {
      listItemIndent: 'one',
    })
    .stringify(ast);
  };

  // Function to fetch the list of available templates
  const fetchAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Map templates to include labels (capitalize the first letter)
      const templatesWithLabels = data.templates.map((template) => ({
        label: template
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: template,
      }));
      setAvailableTemplates(templatesWithLabels);
    } catch (error) {
      console.error('Error fetching available templates:', error);
      toast.error('Failed to load available templates.');
    }
  };

  // Fetch available templates on component mount
  useEffect(() => {
    fetchAvailableTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle template selection
  const handleTemplateChange = async (e) => {
    fetchTemplate(e.target.value);
  }

  const fetchTemplate = async (templateName) => {
  
    // Always fetch the template, even if the same one is selected
    const templateContent = await fetchMarkdownTemplate(templateName);
    if (templateContent === null) {
      return; // Do not proceed if fetching failed
    }
  
    // Push the current content to the undo stack before loading a new template
    setUndoStack((prevUndo) => {
      const updatedUndo = [...prevUndo, markdownContentRef.current];
      saveUndoStack(updatedUndo);
      return updatedUndo;
    });
  
    // Update the editor with the new template content
    markdownContentRef.current = templateContent;
    setCurrentContent(templateContent);
    const easyMDE = getEasyMDEInstance();
    if (easyMDE) {
      easyMDE.value(templateContent); // Ensure the editor content is updated
    }
  
    setProposedContent(null);
  
    // Add a new version with the template loading action
    addNewVersion(templateContent, `Loaded template: ${templateName}`);
  
    toast.success(`Template "${templateName}" reloaded successfully!`);
  
    // Update the selected template after reloading
    setSelectedTemplate(templateName);
  };

  // Function to load versions from localStorage
  const loadVersions = () => {
    const storedVersions = localStorage.getItem(LOCAL_STORAGE_KEY_VERSIONS);
    if (storedVersions) {
      try {
        const parsed = JSON.parse(storedVersions);
        setVersions(parsed);
      } catch (error) {
        console.error('Error parsing versions from localStorage:', error);
        setVersions([]);
      }
    } else {
      setVersions([]);
    }
  };

  // Function to save versions to localStorage
  const saveVersions = (newVersions) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_VERSIONS, JSON.stringify(newVersions));
  };

  // Function to load undo stack from localStorage
  const loadUndoStack = () => {
    const storedUndo = localStorage.getItem(LOCAL_STORAGE_KEY_UNDO);
    if (storedUndo) {
      try {
        const parsed = JSON.parse(storedUndo);
        setUndoStack(parsed);
      } catch (error) {
        console.error('Error parsing undo stack from localStorage:', error);
        setUndoStack([]);
      }
    } else {
      setUndoStack([]);
    }
  };

  // Function to save undo stack to localStorage
  const saveUndoStack = (newUndoStack) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_UNDO, JSON.stringify(newUndoStack));
  };

  // Initialize EasyMDE on component mount
  useEffect(() => {
    const initializeEditor = async () => {
      const templateContent = await fetchMarkdownTemplate();
      if (templateContent === null) {
        return; // Do not initialize editor if fetching failed
      }

      // Load versions from localStorage
      loadVersions();

      // If no versions exist, initialize with the template content as the first version
      if (versions.length === 0) {
        const initialVersion = {
          timestamp: new Date().toISOString(),
          content: templateContent,
          command: 'Initial template loaded', // Default command for initial version
        };
        setVersions([initialVersion]);
        saveVersions([initialVersion]);
        markdownContentRef.current = templateContent;
        setCurrentContent(templateContent);
      } else {
        // Load the latest version
        const latestVersion = versions[versions.length - 1];
        markdownContentRef.current = latestVersion.content;
        setCurrentContent(latestVersion.content);
      }

      // Initialize EasyMDE or update the existing instance
      const easyMDE = initializeEasyMDE(editorContainerRef.current, markdownContentRef.current);

      // Set up change handler if not already set
      if (!easyMDE.isChangeHandlerSet) {
        easyMDE.codemirror.on('change', () => {
          const newValue = easyMDE.value();
          // Push the current content to the undo stack before updating
          setUndoStack(prevUndo => {
            const updatedUndo = [...prevUndo, markdownContentRef.current];
            saveUndoStack(updatedUndo);
            return updatedUndo;
          });

          markdownContentRef.current = newValue;
          setCurrentContent(newValue);
        });
        easyMDE.isChangeHandlerSet = true; // Custom flag to prevent multiple handlers
      }
    };

    initializeEditor();

    // Load undo stack
    loadUndoStack();

    // Cleanup on unmount
    return () => {
      destroyEasyMDE(); // Destroy the editor instance on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to add a new version with command
  const addNewVersion = (content, command) => {
    const newVersion = {
      timestamp: new Date().toISOString(),
      content: content,
      command: command, // Store the user-provided command
    };
    const updatedVersions = [...versions, newVersion];
    setVersions(updatedVersions);
    saveVersions(updatedVersions);
  };

  const sendCommand = async (command, content) => {
    try {
      const response = await applyCommand(command, content, 'free-form');
      if (response.isJSON && response.modifiedContent) {
        return response.modifiedContent;
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error in sendCommand:', error);
      toast.error(`AI command failed: ${error.message}`);
      throw error; // Propagate the error to the caller
    }
  };

  const applyChanges = async () => {
    let commandToSend = '';
    let currentType = activeCommandType;

    // Determine which command to send based on active tab
    switch (activeCommandType) {
      case 'predefined':
        if (!predefinedCommand.trim()) {
          toast.error('Please enter a predefined command.');
          return;
        }
        commandToSend = predefinedCommand;
        break;
      case 'free-form':
        if (!freeFormCommand.trim()) {
          toast.error('Please enter free-form instructions.');
          return;
        }
        commandToSend = freeFormCommand;
        break;
      case 'script':
        if (!scriptCommand.trim()) {
          toast.error('Please enter a script.');
          return;
        }
        commandToSend = scriptCommand;
        break;
      case 'script-gen':
        if (!scriptGenCommand.trim()) {
          toast.error('Please enter a script generation command.');
          return;
        }
        commandToSend = scriptGenCommand;
        break;
      default:
        toast.error('Invalid command type.');
        return;
    }


    if (!commandToSend) {
      toast.error('Please select a command.');
      return;
    }

    setIsLoading(true);

    if (activeCommandType === 'script-gen') {
      try {
        const response = await applyCommand(commandToSend, currentContent, 'script-gen');
        if (response.isJSON && response.modifiedContent) {
          setScriptCommand(response.modifiedContent);
          setCommandHistory(prevHistory => [...prevHistory, { command: commandToSend, type: currentType }]);
          setActiveCommandType('script'); // Switch to script tab
          scriptTextareaRef.current?.focus(); // Focus on the script Textarea
        } else {
          console.log('Invalid response from AI', response);
          toast.error('Invalid response from AI');
        }
        setIsLoading(false);
        return; 
      } catch (error) {
        console.error('Error in applyChanges:', error);
        toast.error(`Error applying changes: ${error.message}`);
        setIsLoading(false);
      }
    }

    if (activeCommandType === 'script') {
      try {
        let userFunction;
    
        // Inner try-catch to handle syntax errors during Function creation
        // This example script removes all heading elements from the markdown content.
        //ast.children = ast.children.filter(node => node.type !== 'heading');

        try {
          // Create an async function with 'ast' and 'sendCommand' as parameters
          userFunction = new Function(
            'ast', 
            'sendCommand', 
            'remark',
            'remarkStringify',
            `
              return (async () => {
                ${commandToSend}
              })();
            `);
        } catch (syntaxError) {
          console.error('Syntax Error:', syntaxError);
          toast.error('Syntax error in script.', {
            style: { backgroundColor: 'red', color: 'white' },
          });
          setIsLoading(false);
          return;  // Exit early if there's a syntax error
        }
    
        // Outer try-catch to handle runtime errors during Function execution
        let updatedAST;
        try {
          updatedAST = await userFunction(ast, sendCommand, remark, remarkStringify);
          toast.success('Script executed successfully!');
          console.log('Script updatedAST:', updatedAST);
        } catch (executionError) {
          console.error('Error executing script:', executionError);
          toast.error('Error executing script.', {
            style: { backgroundColor: 'red', color: 'white' },
          });
        }

        // Validate the updated AST
        if (!updatedAST || typeof updatedAST !== 'object') {
          console.log('Script did not return a valid AST.');
          setIsLoading(false);
          return;
        }

        // Convert the updated AST back to markdown
        const updatedMarkdown = stringifyASTToMarkdown(updatedAST);

        setProposedContent(updatedMarkdown);
        setCommandHistory(prevHistory => [...prevHistory, "Ran script"]);
        // Add a new version with the associated command
        addNewVersion(updatedMarkdown, "Ran script");

        toast.success('Script executed successfully!');
        console.log('Updated Markdown:', updatedMarkdown);
    
      } catch (unexpectedError) {
        // Catch any other unexpected errors
        console.error('Unexpected Error:', unexpectedError);
        toast.error('An unexpected error occurred.');
      } finally {
        setIsLoading(false);  // Ensure loading state is reset
      }
    
      return;
    }
    
    try {
      const response = await applyCommand(commandToSend, currentContent, currentType);

      if (response.isJSON) {
        // Handle modified content if present
        if (response.modifiedContent) {
          setProposedContent(response.modifiedContent);
          setCommandHistory(prevHistory => [...prevHistory, { command: commandToSend, type: currentType }]);
          // Add a new version with the associated command
          addNewVersion(response.modifiedContent, commandToSend);
        }
        return;
      }

      // Handle MP3 file if present
      const contentType = response.headers.get('Content-Type');
      if (contentType.includes('audio/mpeg')) {
        // Extract filename from headers if available
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'document.mp3';
        if (disposition && disposition.includes('filename=')) {
          filename = disposition.split('filename=')[1].replace(/"/g, '');
        }

        const blob = response.data; 
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
        toast.success('MP3 audio has been generated and downloaded.');
      }

      // Handle DOCX file if present
      if (response.docxBase64) {
        const byteCharacters = atob(response.docxBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = response.fileName || 'document.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Markdown document has been converted to .docx and downloaded.');
      }

    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error(`Error applying changes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const approveChanges = () => {
    if (proposedContent) {
      // Push the current content to the undo stack before approving changes
      setUndoStack(prevUndo => {
        const updatedUndo = [...prevUndo, markdownContentRef.current];
        saveUndoStack(updatedUndo);
        return updatedUndo;
      });

      // Update the current content with the proposed changes
      markdownContentRef.current = proposedContent;
      setCurrentContent(proposedContent);

      // Add the approved changes as a new version with a default command
      addNewVersion(proposedContent, 'Approved changes');

      // First reset proposedContent to trigger the editor rendering
      setProposedContent(null);

      toast.success('Changes approved and applied!');
    }
  };
  
  useEffect(() => {
    // Only initialize EasyMDE when there's no proposedContent (i.e., back in editing mode)
    if (proposedContent === null && editorContainerRef.current) {
      // Destroy any existing instance of EasyMDE
      destroyEasyMDE();

      // Initialize EasyMDE with the updated content
      const easyMDE = initializeEasyMDE(editorContainerRef.current, markdownContentRef.current); 

      // Set up the change handler again to track changes in the editor
      if (easyMDE && !easyMDE.isChangeHandlerSet) {
        easyMDE.codemirror.on('change', () => {
          const newValue = easyMDE.value();
          // Push the current content to the undo stack before updating
          setUndoStack(prevUndo => {
            const updatedUndo = [...prevUndo, markdownContentRef.current];
            saveUndoStack(updatedUndo);
            return updatedUndo;
          });

          markdownContentRef.current = newValue;
          setCurrentContent(newValue);
          // Add a new version with a default command
          addNewVersion(newValue, 'Manual edit');
        });
        easyMDE.isChangeHandlerSet = true;
      }
      
      // Ensure the editor content is updated with the approved content
      easyMDE.value(markdownContentRef.current); // Explicitly set the content in EasyMDE
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposedContent]); // Re-run when proposedContent changes

  useEffect(() => {
    if (currentContent) {
      // Parse the initial content into an AST
      const parsedAST = parseMarkdownToAST(currentContent);
      console.log("parsedAST", parsedAST);
    }
  }, [currentContent]);

  const rejectChanges = () => {
    setProposedContent(null); // Reset proposedContent to return to editor view
    toast.info('Proposed changes rejected.');
  };

  const handleCommandChange = (e) => setCommand(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      applyChanges();
    }
  };

  const reapplyCommand = (oldCommandObj) => {
    const { command, type } = oldCommandObj;
  
    // Set the command in the correct state based on the type
    switch (type) {
      case 'predefined':
        setPredefinedCommand(command);
        break;
      case 'free-form':
        setFreeFormCommand(command);
        break;
      case 'script':
        setScriptCommand(command);
        break;
      case 'script-gen':
        setScriptGenCommand(command);
        break;
      default:
        console.error('Unknown command type:', type);
        return;
    }
  
  };
  

  // Function to clear local storage and reset the editor content
  const clearLocalStorage = async () => {
    try {
      localStorage.removeItem("smde_markdown-editor"); // Clear the local storage key used by EasyMDE
      localStorage.removeItem(LOCAL_STORAGE_KEY_VERSIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_UNDO);
      const templateContent = await fetchMarkdownTemplate();
      if (templateContent === null) {
        return; // Do not proceed if fetching failed
      }
      markdownContentRef.current = templateContent;
      setCurrentContent(templateContent);
      setProposedContent(null);
      setVersions([{ timestamp: new Date().toISOString(), content: templateContent, command: 'Initial template loaded' }]);
      setUndoStack([]);
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

  // Function to handle undo action
  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info('Nothing to undo.');
      return;
    }

    const lastState = undoStack[undoStack.length - 1];
    setUndoStack(prevUndo => {
      const updatedUndo = prevUndo.slice(0, -1);
      saveUndoStack(updatedUndo);
      return updatedUndo;
    });

    // Update the editor with the last state
    markdownContentRef.current = lastState;
    setCurrentContent(lastState);
    const easyMDE = getEasyMDEInstance();
    if (easyMDE) {
      easyMDE.value(lastState);
    }

    // Remove the last version as it's being undone
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.slice(0, -1);
      saveVersions(updatedVersions);
      return updatedVersions;
    });

    toast.success('Undid the last change.');
  };

  // Function to handle selecting a specific version
  const handleSelectVersion = (version) => {
    // Push current state to undo stack
    setUndoStack(prevUndo => {
      const updatedUndo = [...prevUndo, markdownContentRef.current];
      saveUndoStack(updatedUndo);
      return updatedUndo;
    });

    // Update to the selected version
    markdownContentRef.current = version.content;
    setCurrentContent(version.content);
    const easyMDE = getEasyMDEInstance();
    if (easyMDE) {
      easyMDE.value(version.content);
    }

    toast.success(`Reverted to version from ${new Date(version.timestamp).toLocaleString()}.`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI-Assisted Markdown Document Editor</h1>

      {/* Dropdown to select templates */}
      {!proposedContent ? (
        <div className="mb-4 flex items-center space-x-4">
          {/* Label */}
          <label htmlFor="template-select" className="font-semibold">
            Choose Template:
          </label>

          {/* Select Dropdown */}
          <select
            id="template-select"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className="p-2 border rounded flex-1"
            disabled={isLoading || availableTemplates.length === 0}
          >
            {availableTemplates.length === 0 ? (
              <option>No templates available.</option>
            ) : (
              availableTemplates.map((template) => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))
            )}
          </select>

          {/* Reload Button */}
          <Button
            onClick={() => fetchTemplate(selectedTemplate)}
            disabled={isLoading || !selectedTemplate}
            className="sm:w-auto"
          >
            {isLoading ? 'Reloading template...' : 'Reload Template'}
          </Button>
        </div>
      ) : (
        <div>
        </div>
      )}

      {/* Conditional Rendering Based on proposedContent */}
      {!proposedContent ? (
        // Editor and Command Input Section
        <div className="flex flex-col md:flex-row gap-4">
          {/* Editor Section */}
          <div className="w-full md:w-2/3">
            {/* Assign the ref to the textarea */}
            <textarea ref={editorContainerRef} id="markdown-editor" />
          </div>

          {/* Command and History Section */}
          <div className="w-full md:w-1/3">
            <Tabs value={activeCommandType} onValueChange={(value) => setActiveCommandType(value)}>
              {/* Tabs for Command Types */}
                <TabsList className="mb-4">
                  <TabsTrigger value="predefined">Predefined</TabsTrigger>
                  <TabsTrigger value="free-form">Free-form</TabsTrigger>
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="script-gen">Generate</TabsTrigger>
                </TabsList>

                {/* TabsContent for predefined commands */}
                <TabsContent value="predefined">
                  <Textarea
                    placeholder="Enter a predefined command..."
                    value={predefinedCommand}
                    onChange={(e) => setPredefinedCommand(e.target.value)}
                    className="mb-4"
                    disabled={isLoading}
                  />
                </TabsContent>

                {/* TabsContent for free-form commands */}
                <TabsContent value="free-form">
                  <Textarea
                    placeholder="Enter free-form instructions..."
                    value={freeFormCommand}
                    onChange={(e) => setFreeFormCommand(e.target.value)}
                    className="mb-4"
                    disabled={isLoading}
                  />
                </TabsContent>

                {/* TabsContent for script-based commands */}
                <TabsContent value="script">
                  {/* Replace textarea with CodeMirror */}
                  <CodeMirror
                    value={scriptCommand}
                    height="400px" // Adjust height as needed
                    extensions={extensions}
                    onChange={(value) => setScriptCommand(value)}
                    theme={vscodeDark}
                    className="mb-4 border border-gray-200 rounded" // Optional styling
                    // Optional: Add additional props as needed
                  />
                </TabsContent>

                {/* TabsContent for AI-generated script commands */}
                <TabsContent value="script-gen">
                  <Textarea
                    placeholder="Generate script using AI..."
                    value={scriptGenCommand}
                    onChange={(e) => setScriptGenCommand(e.target.value)}
                    className="mb-4"
                    disabled={isLoading}
                  />
                </TabsContent>
                {/* Apply button visible for all command types */}
                <Button onClick={applyChanges} disabled={isLoading} className="w-full">
                  {isLoading ? 'Applying...' : 'Run Command'}
                </Button>

                {commandHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Command History:</h3>
                    <ul className="list-disc pl-5">
                      {[...commandHistory].reverse().map((cmdObj, index) => (
                        <li key={index} className="mb-1">
                          <button
                            onClick={() => reapplyCommand(cmdObj)}
                            className="text-blue-500 hover:underline"
                          >
                            {cmdObj.command} ({cmdObj.type}) {/* Display the command and its type */}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Clear Storage & Reset Editor Button */}
                <Button onClick={clearLocalStorage} className="mt-4 w-full">
                  Clear Storage & Reset Editor
                </Button>
            </Tabs>
          </div>
        </div>
      ) : (
        // Diff and Approval Section
        <div className="proposed-changes-container">
          <h2 className="text-xl font-semibold mb-4">Review Proposed Changes</h2>
          <div className="proposed-changes mb-6">
            {renderDiff(currentContent, proposedContent)}
          </div>
          <div className="flex gap-4">
            <Button onClick={approveChanges} color="green" className="flex-1">
              Approve
            </Button>
            <Button onClick={rejectChanges} color="red" className="flex-1">
              Reject
            </Button>
          </div>
          {/* Optional: Add a button to go back to editing without approving/rejecting */}
          <Button onClick={() => setProposedContent(null)} className="mt-4 w-full">
            Go Back to Editor
          </Button>
        </div>
      )}

      {/* Undo and Version Controls moved to the bottom */}
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleUndo} disabled={undoStack.length === 0}>
            Undo
          </Button>
        </div>

        <Tabs defaultValue="versions">
          <TabsContent value="versions">
            <div className="mt-2">
              <h3 className="font-semibold mb-2">Version History:</h3>
              {versions.length === 0 ? (
                <p>No versions available.</p>
              ) : (
                <ul className="list-disc pl-5 max-h-60 overflow-y-auto">
                  {/* Reverse the versions array to show latest first */}
                  {[...versions].reverse().map((version, index) => (
                    <li key={index} className="mb-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleSelectVersion(version)}
                          className="text-blue-500 hover:underline"
                        >
                          {new Date(version.timestamp).toLocaleString()}
                        </button>
                        {/* Display the associated command/instruction */}
                        <span className="text-sm text-gray-600 ml-4">
                          Instruction: {version.command}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;