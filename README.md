# AI-Draft-Guru

## Project Overview

**AI-Draft-Guru** is a web application prototype that enables users to create, edit, and manipulate Markdown documents with the assistance of AI-driven commands. The application consists of a **React-based frontend** and a **Node.js backend** built with Express. The backend uses OpenAI's GPT-4 API to process user commands and apply the requested changes to Markdown documents.

The goal of AI-Draft-Guru is to simplify document editing and formatting by enabling users to issue natural language commands such as "Convert all headings to level 2" or "Bold all instances of 'important'." These commands are processed by AI, which updates the document automatically.

In addition, the application allows users to **convert Markdown documents into MP3 audio files** using AI-powered Text-to-Speech (TTS) or export documents to **Microsoft Word (DOCX)** format.

---

## Key Features

1. **Markdown Editor**:
   - A rich text editor based on EasyMDE for writing and editing Markdown content.
   - Toolbar options for common Markdown formatting such as headings, bold, italics, and lists.
   - Markdown features like code blocks, bullet points, and tables are fully supported.
  
2. **Document Templates**:
   - Users can select from a variety of document templates.

3. **AI-Assisted Editing**:
   - The user selects either Predefined or Free Form commands.
     - Predefined commands limit the AI to using functions provided by the software
     - Free Form commands operate on the document and the AI returns the complete document.
   - The user inputs natural language commands to modify the document. 
     - For example, "Bold all headings" or "Insert a summary at the end of the document."
   - After applying the command, the AI processes the document and returns an updated version.
   - The modified document can be reviewed and approved before changes are saved.

4. **Change Review and Approval**:
   - The AI highlights proposed changes, allowing users to review and approve or reject them before applying.
   - Users can track changes through a diff view to ensure accuracy.

5. **Version Control & Undo**:
   - Automatic version tracking enables users to review document history and revert to previous versions.
   - An undo feature lets users roll back changes applied to the document.

6. **MP3 Conversion**:
   - The application can convert Markdown content into MP3 format using AI-powered Text-to-Speech (TTS).
   - You can specify different voices for different speakers within the Markdown document using a predefined YAML speaker map.

7. **DOCX Export**:
   - Users can export their Markdown document to a Microsoft Word (DOCX) file.
   - The conversion process maintains the structure of the Markdown, ensuring that headings, lists, and other elements are preserved in the Word document.

8. **Dummy Mode**:
   - If no OpenAI API key is available, the system operates in "dummy mode," providing a simulated response for testing and demo purposes without real AI integration.

---

## Technologies Used

### **Frontend**:
- **React**: Main framework for building the user interface.
- **Vite**: Build tool and development environment.
- **Tailwind CSS**: Utility-first CSS framework for styling the application.
- **EasyMDE**: Markdown editor providing a rich-text-like experience for Markdown writing.
- **React Query**: For API data fetching and state management.
- **Axios**: Used to send API requests to the backend.
- **react-diff-view**: Used for rendering differences between document versions.

### **Backend**:
- **Node.js**: JavaScript runtime used to run the backend services.
- **Express.js**: Web framework for building the API and routing.
- **OpenAI GPT-4 API**: Provides AI functionality for processing user commands.
- **Unified, Remark-Parse, Remark-Stringify**: Libraries for parsing and manipulating Markdown documents.
- **Winston**: Logging system used to track server activities.
- **fluent-ffmpeg**: Used to process and merge audio files for MP3 conversion.
- **HTMLtoDOCX**: Library for converting HTML output from Markdown into a DOCX format.

---

## Installation and Setup

### **1. Clone the Repository**:
```bash
git clone <YOUR_GIT_URL>
cd ai-draft-guru
```

### **2. Install Dependencies**:
Run the following command to install both frontend and backend dependencies:
```bash
npm install
```

### **3. Environment Setup**:
Navigate to the `backend/` directory and create a `.env` file by copying the example:
```bash
cp .env.example .env
```
Add your OpenAI API key to the `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### **4. Start the Development Servers**:
Run the development servers for both frontend and backend:
```bash
npm run dev
```
This will start the Vite frontend server on `localhost:8080` and the Express backend server on `localhost:3001`.

---

## Available Commands

### **Running the Application**:
- **Start both frontend and backend**:
  ```bash
  npm run dev
  ```
- **Start the frontend only**:
  ```bash
  npm run frontend:dev
  ```
- **Start the backend only**:
  ```bash
  npm run backend:dev
  ```

### **Linting**:
To check for code style issues, run the linter:
```bash
npm run lint
```

---

## Usage

1. **Write Markdown**:
   Open the Markdown editor and write or paste content into the document area.

2. **Enter AI Commands**:
   Enter natural language commands like "Bold all headings" or "Make all level 1 headings level 2" in the command input box.

3. **Apply Changes**:
   Press the "Apply Changes" button to send the document and command to the backend for processing by the AI. The modified document will be returned for review.

4. **Review Changes**:
   The application highlights changes made by the AI. You can approve or reject changes before saving.

5. **Export to MP3**:
   - To convert the document into an MP3 file, use the command: "Convert to MP3."
   - The system will generate an MP3 using the OpenAI Text-to-Speech API. If there are speakers defined in the document (via a speaker map in YAML), it will use different voices for each speaker.

6. **Export to DOCX**:
   - To export the document to Microsoft Word format, use the command: "Convert to DOCX."
   - The application will generate a DOCX file and prompt you to download it.

7. **Version Control & Undo**:
   All document versions are saved automatically. You can undo recent changes or revert to previous versions from the version history.

---

## Example Use Cases

- **Content Writers**: Format blog posts, articles, and reports by issuing commands to adjust headings, bold text, or generate summaries.
- **Technical Writers**: Automate the formatting of technical documents or code snippets without manually editing Markdown tags.
- **Podcasters**: Convert podcast scripts in Markdown format to MP3 audio files with Text-to-Speech conversion for each speaker.
- **Note-Takers**: Quickly apply formatting to notes and documentation using simple language commands, then export to DOCX for sharing.

---

## Contributing

Contributions are welcome! Please ensure that your code adheres to the ESLint configuration and passes all tests before submitting a pull request.

---

