// src/hooks/useApplyCommand.js

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const useApplyCommand = (initialContent) => {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const applyCommand = async (command) => {
    if (!command.trim()) {
      toast.error("Please enter a command before applying changes.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/apply-command", {
        command,
        documentContent: content,
      });
      setContent(response.data.modifiedContent);
      toast.success("Changes applied successfully!");
    } catch (error) {
      console.error("Error applying changes:", error);
      if (error.response) {
        // Server responded with a status other than 2xx
        toast.error(
          `Server Error: ${error.response.data.message || "Please try again later."}`
        );
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network Error: Please check your connection.");
      } else {
        // Something else happened
        toast.error("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { content, setContent, applyCommand, loading };
};

export default useApplyCommand;
