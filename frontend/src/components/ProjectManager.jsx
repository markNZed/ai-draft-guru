// frontend/src/components/ProjectManager.jsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";

const ProjectManager = ({ onProjectSelect, currentProjectName }) => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State to control dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/project');
      if (!response.ok) throw new Error('Failed to fetch projects.');
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load projects.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });
      if (!response.ok) throw new Error('Failed to create project.');
      const data = await response.json();
      setProjects([...projects, data]);
      setNewProjectName('');
      toast.success('Project created successfully.');
      setIsDialogOpen(false); // Close the dialog
      onProjectSelect(data); // Select the newly created project
    } catch (error) {
      console.error(error);
      toast.error('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectName) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      // Implement DELETE /api/project/:projectName if needed
      // For now, assuming deletion is handled differently
      toast.info('Project deletion not implemented.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete project.');
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Projects</h2>
        <Select onValueChange={(value) => onProjectSelect(projects.find(project => project.name === value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project">
              {currentProjectName || "Select a project"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {projects.map((project) => (
                <SelectItem key={project.name} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>     
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">Create New Project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Project</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <Input 
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={createProject} disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManager;
