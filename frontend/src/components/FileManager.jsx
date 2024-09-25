// frontend/src/components/FileManager.jsx

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from 'axios'; // Import axios for HTTP requests

const FileManager = forwardRef(({ projectName, onFileSelect, onFilesChanged, filename }, ref) => {
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch files whenever the projectName changes
  useEffect(() => {
    if (projectName) {
      fetchFiles();
    } else {
      setFiles([]); // Clear files if no project is selected
    }
  }, [projectName]);

  // Function to fetch the list of files for the current project
  const fetchFiles = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`/api/project/${projectName}/files`);
      if (!response.ok) throw new Error('Failed to fetch files.');
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load files.');
    } finally {
      setIsFetching(false);
    }
  };

  // Function to fetch the content of a selected file
  const fetchFileContent = async (fileName) => {
    try {
      const response = await fetch(`/api/project/${projectName}/files/${fileName}`);
      if (!response.ok) throw new Error('Failed to fetch file content.');
      const data = await response.json();
      return data.content; // Return the file content
    } catch (error) {
      console.error('Error fetching file content:', error);
      toast.error(`Failed to load content for "${fileName}".`);
      return null;
    }
  };

  // Function to handle file selection
  const handleFileSelect = async (file) => {
    const content = await fetchFileContent(file.name); // Fetch file content
    if (content !== null) {
      onFileSelect({ ...file, content }); // Pass the file and its content to the parent
    }
  };

  const createFile = async () => {
    const trimmedName = newFileName.trim();
    if (!trimmedName) {
      toast.error('File name cannot be empty.');
      return;
    }

    const duplicate = files.find(file => file.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      toast.error('A file with this name already exists.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/project/${projectName}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (!response.ok) throw new Error('Failed to create file.');
      const data = await response.json();
      setFiles((prevFiles) => [...prevFiles, data]);
      setNewFileName('');
      setIsDialogOpen(false); // Close the dialog
      toast.success('File created successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create file.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileName) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/project/${projectName}/files/${fileName}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete file.');
      
      // Remove the file from the files list
      setFiles((prevFiles) => prevFiles.filter(file => file.name !== fileName));

      // Inform the parent component that the file was deleted
      onFileSelect(null); // Reset the editor if the deleted file was open
      onFilesChanged(fileName); // Notify the parent component

      toast.success('File deleted successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete file.');
    }
  };

  // Expose saveFile method to parent via ref
  useImperativeHandle(ref, () => ({
    saveFile: async (fileName, content) => {
      try {
        const response = await axios.post(`/api/project/${projectName}/files/${fileName}/save`, { content });
        if (response.status === 200) {
          toast.success(`File "${fileName}" saved successfully.`);
          return true;
        } else {
          throw new Error(`Save failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Error saving file:', error);
        toast.error(`Failed to save file "${fileName}".`);
        return false;
      }
    }
  }));

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Files</h2>
      </div>

      {isFetching ? (
        <p className="mt-2 text-gray-500">Loading files...</p>
      ) : (
        <ul className="list-disc pl-5 mt-2">
          {files.length === 0 ? (
            <li className="text-gray-500">No files available.</li>
          ) : (
            files.map(file => (
              <li 
                key={file.name} 
                className={`flex justify-between items-center ${filename === file.name ? 'font-bold' : ''}`}
              >
                <button 
                  onClick={() => handleFileSelect(file)} // Handle file selection
                  className="text-blue-500 hover:underline"
                >
                  {file.name}
                </button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => deleteFile(file.name)}
                  className="ml-2"
                >
                  Delete
                </Button>
              </li>
            ))
          )}
        </ul>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="ml-2">Create New File</Button> 
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New File</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <Input 
              placeholder="File Name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              disabled={loading}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={createFile} disabled={loading}> {/* Trigger file creation */}
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

   </div>
  );
});

export default FileManager;
