// frontend/src/pages/easyMDEManager.js

import EasyMDE from 'easymde';

let easyMDEInstance = null;

export const initializeEasyMDE = (element, initialValue) => {
  if (easyMDEInstance) {
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

export const destroyEasyMDE = () => {
  if (easyMDEInstance) {
    easyMDEInstance.toTextArea();
    easyMDEInstance = null;
  }
};

export const getEasyMDEInstance = () => easyMDEInstance;
