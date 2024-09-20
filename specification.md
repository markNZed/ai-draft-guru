Certainly! Below is an updated **Prototype Specification** for your **AI-Assisted Markdown Document Editor** project, reflecting the current state of your codebase. This specification is designed to provide a comprehensive overview of the project, making it easier to introduce the codebase to a Large Language Model (LLM) or any other collaborator.

---

# **Prototype Specification: AI-Assisted Markdown Document Editor**

## **1. Project Overview**

The **AI-Assisted Markdown Document Editor** is a full-stack web application designed to enable users to create, edit, and manipulate Markdown documents with the assistance of AI-powered commands. The application consists of a React-based frontend and a Node.js (Express) backend that interfaces with OpenAI's GPT-4 API to process user commands for restructuring and restyling Markdown content.

---

## **2. Technology Stack**

### **Frontend**

- **Framework**: React (v18.2.0)
- **Build Tool**: Vite (v5.1.4)
- **Styling**: Tailwind CSS (v3.4.4) with additional plugins:
  - `tailwindcss-animate` for animations
- **State Management & Data Fetching**:
  - `@tanstack/react-query` (v5.0.0)
- **Form Handling**:
  - `react-hook-form` (v7.52.0)
- **Routing**:
  - `react-router-dom` (v6.23.1)
- **Markdown Editor**:
  - `easymde` (v2.15.0)
- **Utilities & Libraries**:
  - `clsx` (v2.1.0) for conditional class names
  - `tailwind-merge` (v2.2.1) for merging Tailwind classes
  - `html-to-image` (v1.11.11) for converting HTML to images
  - `lucide-react` (v0.417.0) for icons
  - `class-variance-authority` (v0.7.0) for managing class name variants
- **UI Components**: Radix UI components (various packages)
- **Notifications**: `sonner` (v1.5.0)
- **Others**:
  - `@hookform/resolvers` (v3.6.0) for integrating with `react-hook-form`
  - `framer-motion` (v11.3.9) for animations
  - `recharts` (v2.12.7) for charts
  - `use-debounce` (v10.0.3) for debouncing hooks
  - `vaul` (v0.9.1) for additional utilities

### **Backend**

- **Runtime**: Node.js (v20.17.0)
- **Framework**: Express.js (v4.18.2)
- **API Client**: OpenAI SDK (v3.2.1)
- **Middleware**:
  - `cors` (v2.8.5) for Cross-Origin Resource Sharing
  - `morgan` (v1.10.0) for HTTP request logging
  - `express-rate-limit` (v6.7.0) for rate limiting
  - `express-validator` (v6.15.0) for input validation
- **Utilities**:
  - `unified` (v10.1.2) with `remark-parse` (v10.0.1) and `remark-stringify` (v10.0.1) for Markdown parsing and stringifying
  - `unist-util-visit` (v4.1.0) for traversing and manipulating the Markdown AST
- **Environment Management**: `dotenv` (v16.0.3) for loading environment variables

### **Development Tools**

- **Linters & Formatters**:
  - `eslint` (v8.56.0) with `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`
- **Build Tools**:
  - `vite` (v5.1.4) with `@vitejs/plugin-react` (v4.2.1) for frontend bundling
- **Utilities**:
  - `nodemon` (v2.0.22) for backend development (auto-restarting server on changes)
  - `concurrently` (v7.6.0) for running frontend and backend simultaneously during development
- **CSS Processing**:
  - `postcss` (v8.4.38)
  - `autoprefixer` (v10.4.20)

---

## **3. Project Structure**

```
ai-draft-guru/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   ├── tooltip.jsx
│   │   │   ├── sonner.jsx
│   │   │   ├── tabs.jsx
│   │   │   └── ...other UI components
│   ├── lib/
│   │   ├── api.js
│   │   └── utils.js
│   ├── pages/
│   │   └── Index.jsx
│   ├── nav-items.jsx
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── vite.config.js
└── ...other configuration files
```

---

## **4. Detailed Components**

### **4.1. Frontend**

#### **4.1.1. `src/pages/Index.jsx`**

- **Purpose**: Main page containing the Markdown editor and command input.
- **Key Features**:
  - Integrates `EasyMDE` as the Markdown editor.
  - Allows users to input commands to modify the Markdown document.
  - Communicates with the backend API to apply changes.
  - Displays success and error notifications using `sonner`.

#### **4.1.2. `src/lib/api.js`**

- **Purpose**: Handles API requests to the backend.
- **Key Functions**:
  - `applyCommand`: Sends user commands and current Markdown content to the backend's `/apply-command` endpoint.

#### **4.1.3. `src/lib/utils.js`**

- **Purpose**: Contains utility functions used across the frontend.
- **Key Features**:
  - Utilizes `clsx` and `tailwind-merge` for conditional class names.

#### **4.1.4. UI Components**

- **Purpose**: Reusable UI components built with Radix UI and styled with Tailwind CSS.
- **Examples**:
  - `button.jsx`
  - `tooltip.jsx`
  - `sonner.jsx`
  - `tabs.jsx`
  - ...others

### **4.2. Backend**

#### **4.2.1. `backend/server.js`**

- **Purpose**: Main server file handling API requests.
- **Key Features**:
  - **CORS Configuration**: Allows requests from `http://localhost:8080`.
  - **Rate Limiting**: Limits each IP to 60 requests per minute.
  - **OpenAI Integration**: Communicates with OpenAI's GPT-4 API to process user commands.
  - **Markdown Processing**:
    - Parses Markdown content into an AST using `unified` with `remark-parse`.
    - Applies AI-generated operations to modify the AST.
    - Converts the modified AST back to Markdown using `remark-stringify`.
  - **Dummy Response Handling**: If `OPENAI_API_KEY` is not set, returns a predefined dummy response instead of calling OpenAI's API.

#### **4.2.2. Environment Variables (`backend/.env`)**

- **Variables**:
  - `OPENAI_API_KEY`: Your OpenAI API key.
  - `PORT`: Port on which the backend server runs (default: 3001).

---

## **5. API Specification**

### **5.1. Endpoint: `/apply-command`**

- **Method**: `POST`
- **Description**: Processes user commands to modify Markdown content.
- **Request Body**:

  ```json
  {
    "command": "string",           // User's command for restructuring/restyling
    "documentContent": "string"    // Current Markdown content
  }
  ```
- **Responses**:

  - **200 OK**:

    ```json
    {
      "modifiedContent": "string", // Updated Markdown content
      "message": "Success"         // Success message
    }
    ```
  - **200 OK with Dummy Result** (when `OPENAI_API_KEY` is not set):

    ```json
    {
      "modifiedContent": "string", // Updated Markdown content based on dummy operations
      "message": "Dummy result because OPENAI_API_KEY is not set"
    }
    ```
  - **400 Bad Request**:

    ```json
    {
      "message": "Invalid input.",
      "errors": [ ... ] // Array of validation errors
    }
    ```
  - **500 Internal Server Error**:

    ```json
    {
      "message": "Error message describing the issue."
    }
    ```
  - **502 Bad Gateway**:

    ```json
    {
      "message": "Error communicating with AI service."
    }
    ```
  - **504 Gateway Timeout**:

    ```json
    {
      "message": "No response from AI service."
    }
    ```

---

## **6. Configuration Files**

### **6.1. `package.json`**

- **Location**: Root directory
- **Purpose**: Manages both frontend and backend dependencies and scripts.
- **Key Sections**:
  - **Scripts**:
    - `dev`: Runs the frontend in development mode using Vite.
    - `build`: Builds the frontend for production.
    - `build:dev`: Builds the frontend in development mode.
    - `lint`: Runs ESLint on the codebase.
    - `preview`: Previews the production build.
    - `backend:dev`: Runs the backend in development mode using Nodemon.
    - `backend:start`: Runs the backend in production mode.
    - `start:all`: Runs both frontend and backend concurrently using `concurrently`.
  - **Dependencies**: Includes both frontend and backend dependencies.
  - **DevDependencies**: Includes development tools like Vite, ESLint, Nodemon, and Concurrently.

### **6.2. `backend/server.js`**

- **Purpose**: Main backend server file (already detailed above).
- **Key Features**:
  - Conditional handling of OpenAI API calls.
  - Dummy response generation when API key is absent.

### **6.3. `tailwind.config.js`**

- **Purpose**: Configures Tailwind CSS.
- **Key Features**:

  - **Content Paths**: Specifies files Tailwind should scan for class names.
  - **Theme Extensions**: Customizes default Tailwind themes.
  - **Plugins**: Integrates `tailwindcss-animate` and other plugins as needed.

  ```js
  // tailwind.config.js

  import tailwindcssAnimate from 'tailwindcss-animate';

  export default {
    content: [
      './index.html',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [
      tailwindcssAnimate,
      // Add other plugins here
    ],
  };
  ```

### **6.4. `vite.config.js`**

- **Purpose**: Configures Vite for the frontend.
- **Key Features**:

  - **Plugins**: Integrates React plugin.
  - **Aliases**: Sets up path aliases for easier imports.

  ```js
  // vite.config.js

  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      hmr: {
        overlay: false, // Disable error overlays if needed
      },
    },
  });
  ```

### **6.5. `postcss.config.js`**

- **Purpose**: Configures PostCSS for processing Tailwind CSS.
- **Configuration**:

  ```js
  // postcss.config.js

  export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
  ```

---

## **7. Environment Variables**

### **7.1. Backend (`backend/.env`)**

```env
# backend/.env

OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

- **`OPENAI_API_KEY`**: Your OpenAI API key for accessing GPT-4 services.
- **`PORT`**: Port number on which the backend server runs (default: 3001).

**Note**: Ensure that `.env` is listed in `.gitignore` to prevent sensitive information from being committed to version control.

---

## **8. Running the Application**

### **8.1. Installation**

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/ai-draft-guru.git
   cd ai-draft-guru
   ```
2. **Install All Dependencies**:

   ```bash
   npm install
   ```

   This command installs both frontend and backend dependencies as they are merged into the top-level `package.json`.

### **8.2. Setting Up Environment Variables**

1. **Create `.env` File**:

   Navigate to the `backend` directory and create a `.env` file based on `.env.example`.

   ```bash
   cd backend
   cp .env.example .env
   ```
2. **Set Your OpenAI API Key**:

   Edit the `.env` file and set your OpenAI API key.

   ```env
   OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
   PORT=3001
   ```

### **8.3. Running the Application**

#### **8.3.1. Development Mode**

Run both frontend and backend concurrently in development mode:

```bash
npm run start:all
```

- **Frontend**: Accessible at `http://localhost:8080`
- **Backend**: Runs on `http://localhost:3001`

#### **8.3.2. Backend Only**

To run the backend server separately (useful for testing or backend-specific development):

```bash
npm run backend:dev
```

#### **8.3.3. Frontend Only**

To run the frontend development server separately:

```bash
npm run dev
```

### **8.4. Building for Production**

1. **Build the Frontend**:

   ```bash
   npm run build
   ```

   This command generates the production-ready frontend in the `dist` directory.
2. **Start the Backend in Production Mode**:

   ```bash
   npm run backend:start
   ```

   Ensure that the frontend build is correctly served, possibly using a static file server or integrating with the backend if necessary.

---

## **9. Handling Missing OpenAI API Key**

### **9.1. Conditional API Integration**

The backend is designed to gracefully handle scenarios where the `OPENAI_API_KEY` is not set. In such cases, the server returns a dummy response without attempting to communicate with the OpenAI API.

### **9.2. Implementation Details**

#### **9.2.1. Initialization**

```js
let openai;

if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
}
```

- **Purpose**: Checks for the presence of `OPENAI_API_KEY`. If available, initializes the OpenAI API client.

#### **9.2.2. `/apply-command` Endpoint Modification**

```js
app.post(
  '/apply-command',
  [
    body('command').isString().notEmpty(),
    body('documentContent').isString().notEmpty(),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input.', errors: errors.array() });
    }

    const { command, documentContent } = req.body;

    // Check if OpenAI API key is missing
    if (!openai) {
      // Return dummy response if API key is not set
      const dummyResponse = {
        operations: [
          {
            type: 'change_heading',
            parameters: {
              match: 'Introduction',
              newLevel: 2,
            },
          },
          {
            type: 'emphasize_text',
            parameters: {
              text: 'important',
            },
          },
        ],
      };

      // Parse the document and apply the dummy operations
      const processor = unified().use(remarkParse).use(remarkStringify);
      let tree = processor.parse(documentContent);
      applyOperations(tree, dummyResponse.operations);
      const modifiedContent = processor.stringify(tree);

      return res.json({ modifiedContent, message: 'Dummy result because OPENAI_API_KEY is not set' });
    }

    // Original logic to handle OpenAI API call
    const prompt = constructPrompt(command, documentContent);
    try {
      const aiResponse = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.2,
      });

      const aiText = aiResponse.data.choices[0].text.trim();
      const instructions = JSON.parse(aiText);

      if (!instructions.operations || !Array.isArray(instructions.operations)) {
        return res.status(500).json({ message: 'AI response does not contain a valid "operations" array.' });
      }

      const processor = unified().use(remarkParse).use(remarkStringify);
      let tree = processor.parse(documentContent);
      applyOperations(tree, instructions.operations);
      const modifiedContent = processor.stringify(tree);

      return res.json({ modifiedContent, message: 'Success' });
    } catch (error) {
      if (error.response) {
        // OpenAI API responded with an error
        console.error('OpenAI API error:', error.response.status, error.response.data);
        return res.status(502).json({ message: 'Error communicating with AI service.' });
      } else if (error.request) {
        // No response received from OpenAI API
        console.error('No response from OpenAI API:', error.request);
        return res.status(504).json({ message: 'No response from AI service.' });
      } else {
        // Other errors
        console.error('Error setting up OpenAI API request:', error.message);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    }
  }
);
```

- **Behavior**:
  - **With `OPENAI_API_KEY`**: Processes user commands using OpenAI's GPT-4 API and returns the modified Markdown content.
  - **Without `OPENAI_API_KEY`**: Returns a predefined dummy response by applying hardcoded operations to the Markdown content.

### **9.3. Benefits**

- **Development Flexibility**: Allows developers to work on the frontend and backend without requiring an OpenAI API key.
- **Graceful Degradation**: Ensures that the application remains functional even if the AI service is unavailable.

---

## **10. Error Handling**

### **10.1. Frontend Errors**

- **CORS Issues**: Configured via backend CORS settings to allow requests from `http://localhost:8080`.
- **Network Errors**: Handled by displaying error messages using `sonner` notifications.
- **Validation Errors**: Displayed when the backend returns `400 Bad Request`.

### **10.2. Backend Errors**

- **Validation Errors**: Responds with `400 Bad Request` and details of the validation failures.
- **OpenAI API Errors**: Differentiates between API errors (`502 Bad Gateway`) and timeouts (`504 Gateway Timeout`).
- **JSON Parsing Errors**: Responds with `500 Internal Server Error` if AI response cannot be parsed.
- **Unknown Operations**: Logs warnings for unrecognized operation types without crashing the server.

---

## **11. Setup Instructions**

### **11.1. Prerequisites**

- **Node.js**: Ensure Node.js (v20.17.0) is installed.
- **npm**: Comes bundled with Node.js.

### **11.2. Installation Steps**

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/ai-draft-guru.git
   cd ai-draft-guru
   ```
2. **Install Dependencies**:

   ```bash
   npm install
   ```

   This installs both frontend and backend dependencies as they are merged into the top-level `package.json`.
3. **Set Up Environment Variables**:

   - Navigate to the backend directory:

     ```bash
     cd backend
     ```
   - Create and configure the `.env` file:

     ```bash
     cp .env.example .env
     ```

     Edit `.env` to include your OpenAI API key:

     ```env
     OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
     PORT=3001
     ```
   - Return to the root directory:

     ```bash
     cd ..
     ```
4. **Run the Application**:

   - **Development Mode** (Frontend and Backend concurrently):

     ```bash
     npm run start:all
     ```

     - **Frontend**: Accessible at `http://localhost:8080`
     - **Backend**: Runs on `http://localhost:3001`
   - **Backend Only**:

     ```bash
     npm run backend:dev
     ```
   - **Frontend Only**:

     ```bash
     npm run dev
     ```

### **11.3. Building for Production**

1. **Build Frontend**:

   ```bash
   npm run build
   ```

   This generates the production-ready frontend in the `dist` directory.
2. **Start Backend in Production Mode**:

   ```bash
   npm run backend:start
   ```

   Ensure that the frontend build is correctly served, possibly using a static file server or integrating with the backend if necessary.

---

## **12. Usage**

1. **Accessing the Application**:

   Open your browser and navigate to `http://localhost:8080` to access the frontend.
2. **Editing Markdown Documents**:

   - Use the integrated `EasyMDE` editor to write or paste your Markdown content.
   - Enter AI commands in the designated input area to modify the document (e.g., "Change all first-level headings to second-level and emphasize the word 'important'").
   - Click "Apply Changes" to send the command to the backend.
3. **Applying Commands**:

   - **With OpenAI API Key**: The backend processes the command using OpenAI's GPT-4 API and returns the modified Markdown.
   - **Without OpenAI API Key**: The backend returns a dummy response with predefined operations.
4. **Viewing Results**:

   The modified Markdown content will appear in the editor, reflecting the changes based on the AI command or dummy response.

---

## **13. Extensibility**

### **13.1. Adding New Operation Types**

To support additional Markdown manipulation operations:

1. **Define New Operation Types** in `backend/server.js` within the `applyOperations` function.

   ```js
   case 'insert_text':
     {
       const { location, text } = op.parameters;
       if (location.type === 'after_heading') {
         const { heading } = location;
         let targetNode = null;

         // Find the heading node
         visit(tree, 'heading', (node) => {
           if (node.children && node.children[0] && node.children[0].value === heading) {
             targetNode = node;
           }
         });

         if (targetNode) {
           const newParagraph = {
             type: 'paragraph',
             children: [{ type: 'text', value: text }],
           };

           // Insert the new paragraph after the heading
           const parent = targetNode.parent;
           const index = parent.children.indexOf(targetNode);
           parent.children.splice(index + 1, 0, newParagraph);
         }
       }
     }
     break;
   ```
2. **Update AI Prompt** in `constructPrompt` to guide the AI in generating instructions for the new operation types.

### **13.2. Enhancing Frontend Features**

- **Real-time Collaboration**: Implement WebSockets for real-time editing by multiple users.
- **Authentication**: Add user authentication and authorization for secure access.
- **Rich Text Features**: Enhance the editor with more rich text capabilities like tables, images, and links.

---

## **14. Security Considerations**

### **14.1. Protecting Sensitive Information**

- **Environment Variables**: Ensure `.env` is listed in `.gitignore` to prevent exposure of sensitive data like `OPENAI_API_KEY`.
- **API Key Security**: Do not expose the OpenAI API key on the frontend. All interactions with OpenAI should be routed through the backend.

### **14.2. Rate Limiting**

- **Purpose**: Prevent abuse and manage API costs by limiting the number of requests per IP.
- **Configuration**: Set to 60 requests per minute per IP.

### **14.3. CORS Policy**

- **Configuration**: Restricts API access to the specified frontend origin (`http://localhost:8080`).
- **Best Practices**: Avoid using wildcard (`*`) origins in production to enhance security.

### **14.4. Input Validation**

- **Implementation**: Uses `express-validator` to validate incoming requests to the `/apply-command` endpoint.
- **Purpose**: Prevent injection attacks and ensure data integrity.

---

## **15. Logging and Monitoring**

### **15.1. Backend Logging**

- **Tool**: `morgan` (v1.10.0)
- **Configuration**: Logs all HTTP requests in the `combined` format for comprehensive logging.

### **15.2. Error Logging**

- **Strategy**:
  - Logs detailed error messages to the server console.
  - Differentiates between different error types (e.g., validation errors, API errors).

### **15.3. Frontend Notifications**

- **Tool**: `sonner`
- **Purpose**: Displays success and error notifications to users based on API responses.

---

## **16. Development Workflow**

### **16.1. Running the Development Servers**

- **Start Both Frontend and Backend**:

  ```bash
  npm run start:all
  ```
- **Start Backend Only**:

  ```bash
  npm run backend:dev
  ```
- **Start Frontend Only**:

  ```bash
  npm run dev
  ```

### **16.2. Code Linting**

- **Run ESLint**:

  ```bash
  npm run lint
  ```

### **16.3. Building for Production**

- **Build Frontend**:

  ```bash
  npm run build
  ```
- **Start Backend in Production**:

  ```bash
  npm run backend:start
  ```

### **16.4. Restarting Servers**

- **Nodemon**: Automatically restarts the backend server upon detecting file changes during development.

---

## **17. Troubleshooting**

### **17.1. Dependency Issues**

- **Symptom**: Vite fails to resolve certain imports.
- **Solution**:
  - Ensure all dependencies are listed in `package.json`.
  - Run `npm install` to install missing packages.
  - If issues persist, delete `node_modules` and `package-lock.json`, then reinstall:

    ```bash
    rm -rf node_modules package-lock.json
    npm install
    ```

### **17.2. CORS Errors**

- **Symptom**: Cross-Origin Request Blocked errors in the browser console.
- **Solution**:
  - Verify that the backend's CORS configuration allows requests from the frontend's origin (`http://localhost:8080`).
  - Ensure that the frontend is correctly pointing to the backend's API URL.

### **17.3. Backend Crashes**

- **Symptom**: Server crashes with import or runtime errors.
- **Solution**:
  - Ensure that `package.json` has `"type": "module"` for ES module support.
  - Verify all import statements are correct and correspond to the installed packages.
  - Check for missing dependencies and install them as needed.

### **17.4. OpenAI API Issues**

- **Symptom**: Errors related to OpenAI API communication.
- **Solution**:
  - Ensure that `OPENAI_API_KEY` is correctly set in the `.env` file.
  - Verify network connectivity to OpenAI's servers.
  - Check OpenAI's service status for any outages.

---

## **18. Future Enhancements**

- **User Authentication**: Implement secure user login and registration.
- **Advanced Markdown Features**: Support for tables, images, and code blocks with syntax highlighting.
- **Real-time Collaboration**: Allow multiple users to edit the same document simultaneously.
- **Export Options**: Enable exporting Markdown to various formats like PDF, HTML, or DOCX.
- **AI Command Customization**: Allow users to define and customize their own AI commands for document manipulation.
- **Analytics Dashboard**: Provide insights into document usage and AI command effectiveness.

---

## **19. Conclusion**

The **AI-Assisted Markdown Document Editor** combines a robust frontend with a powerful backend to provide an intuitive and intelligent Markdown editing experience. By leveraging modern technologies like React, Vite, Express.js, and OpenAI's GPT-4, the application offers dynamic content manipulation through user-friendly commands. The current implementation ensures flexibility, security, and scalability, laying a strong foundation for future enhancements and feature expansions.

---

This specification should provide a clear and comprehensive understanding of your project's current state, facilitating seamless onboarding for any collaborators or automated tools like LLMs. If you need further refinements or additional sections, feel free to ask!
