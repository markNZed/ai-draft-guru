// frontend/src/components/FileManager.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const FileManager = ({ projectId, onFileSelect, currentFileId }) => {
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/project/${projectId}/files`);
      if (!response.ok) throw new Error('Failed to fetch files.');
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load files.');
    }
  };

  useEffect(() => {
    if (projectId) fetchFiles();
  }, [projectId]);

  const createFile = async () => {
    if (!newFileName.trim()) {
      toast.error('File name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/project/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFileName }),
      });
      if (!response.ok) throw new Error('Failed to create file.');
      const data = await response.json();
      setFiles([...files, data]);
      setNewFileName('');
      toast.success('File created successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create file.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/project/${projectId}/files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete file.');
      setFiles(files.filter(file => file.fileId !== fileId));
      toast.success('File deleted successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete file.');
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Files</h2>
      <ul className="list-disc pl-5">
        {files.map(file => (
          <li key={file.fileId} className={`flex justify-between items-center ${currentFileId === file.fileId ? 'font-bold' : ''}`}>
            <button onClick={() => onFileSelect(file)} className="text-blue-500 hover:underline">
              {file.name}
            </button>
            <Button variant="destructive" size="sm" onClick={() => deleteFile(file.fileId)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4">Create New File</Button>
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
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={createFile} disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileManager;
