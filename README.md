Here is the updated README file aligned with the project structure and content:

---

# AI-Draft-Guru

## Project Overview

**AI-Draft-Guru** is a prototype of a web application that enables users to create, edit, and manipulate Markdown documents with AI-assisted commands. This project consists of a **React-based frontend** and a **Node.js (Express) backend** that interfaces with OpenAI's GPT-4o API to process user commands.

From the end user's perspective, the **AI-Assisted Markdown Document Editor** is a tool that makes creating, editing, and manipulating Markdown documents easier by allowing users to give natural language commands that automatically adjust their documents. Here’s how the tool works for an end user:

---

### **Overview**

The tool allows users to write Markdown content while utilizing AI to make structural or stylistic changes to the document. For example, instead of manually updating headings or formatting text, users can input commands like "Change all first-level headings to second-level" or "Bold all instances of the word 'important'," and the tool automatically makes those changes.

---

### **Key Features**

1. **Markdown Editor**:

   - The editor provides a standard Markdown writing environment. It supports all typical Markdown syntax (like headings, bullet points, code blocks, etc.).
   - The interface includes a text area for writing and editing the Markdown document. It is based on the EasyMDE editor, meaning users have toolbar buttons for common Markdown actions (bold, italics, headings, etc.).
2. **AI Commands**:

   - **Input Commands**: On the right-hand side of the screen, there is a command input box. Users can write simple instructions to the AI, such as:
     - "Convert all level 1 headings to level 2."
     - "Underline every mention of the word 'important'."
     - "Add a summary at the end of the document."
   - **Execute Commands**: After typing the command, the user clicks an "Apply Changes" button. The tool sends the command and document content to the backend, where the AI processes the request and modifies the document based on the instructions.
3. **Highligted review of changes for approval**
   - The AI will highlight the changes it has made to the document.
   - The user can then approve the changes and the changes are saved to the document.
4. **Real-time Feedback**:
   - Users can see the modifications applied automatically without having to scroll through the entire document and manually make changes.
5. **Version control with Undo**
   - Previous versions can be viewed and the curruent changes can be undone.
6. **Dummy Mode**:
   - If the AI service is unavailable (e.g., due to missing API keys), the tool will still function. It returns a "dummy" result with predefined changes that showcase how the system operates. This ensures users can continue experimenting with commands even without full AI integration.

---

### **How It Works**

1. **Write Markdown**:
   Users begin by writing or pasting their Markdown content into the editor. This could be anything from a blog post, technical documentation, or notes.
2. **Enter Command**:
   In the command box, users type a natural language command that they want the AI to apply to the document. For example, if users want to change all headings of level 1 to level 2, they would type: "Change all level 1 headings to level 2."
3. **Apply Changes**:
   Users press the "Apply Changes" button to send the command and current Markdown content to the backend for processing.
4. **AI Processes the Request**:
   The tool uses an AI model (OpenAI’s GPT-4) to understand the command and analyze the document. The AI provides instructions that are used to modify the document automatically.
5. **View Updated Document**:
   The editor updates with the modified content based on the AI’s response. For example, headings will be changed or specific words may be bolded as instructed by the user.

---

### **Typical Use Cases**

- **Bloggers & Writers**: Writers can use the tool to format their posts efficiently. Instead of manually adjusting formatting for headings, lists, or bold/italic text, they can use commands like "Turn all subheadings into H2" or "Emphasize all instances of key terms."
- **Developers & Technical Writers**: When documenting code or writing technical guides, developers can use AI commands to structure their documents efficiently. For instance, they can split sections, update code blocks, or insert table of contents quickly.
- **Students & Note-takers**: Students can use the editor for note-taking, with the ability to reformat notes after initial writing by simply inputting commands like "Make all topic headings bold" or "Underline all important terms."

---

### **What Makes It Unique**

- **Natural Language Processing**: Unlike traditional Markdown editors, this tool empowers users to edit and restructure their documents without manually going through the content line by line. Instead, users can rely on simple, natural language commands.
- **AI-Driven**: The integration of OpenAI’s GPT-4 means that the tool can understand complex instructions and apply meaningful changes to the Markdown content automatically.
- **No Markdown Expertise Needed**: While Markdown is user-friendly, some users may find the formatting tedious. This tool removes that barrier by allowing the AI to handle most of the document’s structural and formatting needs.

---

### Technologies Used

- **Frontend**:

  - React (with Vite as the build tool)
  - Tailwind CSS (for styling)
  - EasyMDE (for Markdown editing)
  - Axios (for API requests)
  - React Query (for state management)
- **Backend**:

  - Node.js
  - Express.js
  - OpenAI API
  - Markdown manipulation (Unified, Remark-Parse, Remark-Stringify)

### Setup and Installation

To set up the project locally:

1. **Clone the repository**:

   ```bash
   git clone <YOUR_GIT_URL>
   cd ai-draft-guru
   ```
2. **Install dependencies**:

   ```bash
   npm install
   ```
3. **Set up environment variables**:

   - Go to the `backend/` directory and create a `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Add your OpenAI API key:
     ```bash
     OPENAI_API_KEY=your_openai_api_key_here
     ```
4. **Run the development servers**:

   ```bash
   npm run start
   ```

   This will run both the frontend (Vite) and backend (Node.js) servers.

### Development Commands

- **Start frontend and backend**:
  ```bash
  npm run dev
  ```
- **Start only the backend**:
  ```bash
  npm run backend:dev
  ```
- **Start only the frontend**:
  ```bash
  npm run frontend:dev
  ```
- **Lint the project**:
  ```bash
  npm run lint
  ```

### Environment Variables

- **OPENAI_API_KEY**: Your OpenAI API key
- **PORT**: Backend server port (default: 3001)

### Deployment

You can deploy this project via various platforms such as Netlify, Vercel, or using the GPT Engineer app.

---

Feel free to use this README file for your project, ensuring it accurately reflects the structure and technologies you've implemented.
