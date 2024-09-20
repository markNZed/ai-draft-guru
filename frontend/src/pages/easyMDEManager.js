// easyMDEManager.js
import EasyMDE from 'easymde';

// Module-level variable to hold the EasyMDE instance
let easyMDEInstance = null;

// Function to initialize EasyMDE
export const initializeEasyMDE = (element, initialValue) => {
  if (easyMDEInstance) {
    // If already initialized, just update the value
    easyMDEInstance.value(initialValue);
    return easyMDEInstance;
  }

  easyMDEInstance = new EasyMDE({
    element,
    initialValue,
    autosave: {
      enabled: true,
      delay: 1000,
      uniqueId: "smde_markdown-editor",
    },
    placeholder: "Type your Markdown here...",
    spellChecker: false,
  });

  return easyMDEInstance;
};

// Function to destroy EasyMDE
export const destroyEasyMDE = () => {
  if (easyMDEInstance) {
    easyMDEInstance.toTextArea();
    easyMDEInstance = null;
  }
};

// Function to get the current EasyMDE instance
export const getEasyMDEInstance = () => easyMDEInstance;
