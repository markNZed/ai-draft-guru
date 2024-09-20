Here is the updated README file aligned with the project structure and content:

---

# AI-Draft-Guru

## Project Overview

**AI-Draft-Guru** is a web application that enables users to create, edit, and manipulate Markdown documents with AI-assisted commands. This project consists of a **React-based frontend** and a **Node.js (Express) backend** that interfaces with OpenAI's GPT-4 API to process user commands.

## Project Structure

```
ai-draft-guru/
├── backend/
│   ├── server.mjs
│   ├── package.json
│   ├── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── hooks/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
├── .prettierrc
├── .eslintrc.cjs
├── README.md
├── package.json
└── other config files...
```

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
    npm run start:all
    ```
- **Start only the backend**:
    ```bash
    npm run backend:dev
    ```
- **Start only the frontend**:
    ```bash
    npm run dev
    ```
- **Lint the project**:
    ```bash
    npm run lint
    ```

### Running in Production

To build and run in production:

1. **Build the frontend**:
    ```bash
    npm run build
    ```

2. **Start the backend**:
    ```bash
    npm run backend:start
    ```

The frontend will be built into the `dist/` folder and served by the backend if required.

### API Documentation

- **POST** `/api/apply-command`

  This endpoint processes user commands to modify the Markdown content using the OpenAI API.

  **Request**:
  ```json
  {
    "command": "string",
    "documentContent": "string"
  }
  ```

  **Response**:
  ```json
  {
    "modifiedContent": "string"
  }
  ```

  - If `OPENAI_API_KEY` is not set, the API will return a dummy response.

### Environment Variables

- **OPENAI_API_KEY**: Your OpenAI API key
- **PORT**: Backend server port (default: 3001)

### Deployment

You can deploy this project via various platforms such as Netlify, Vercel, or using the GPT Engineer app.

---

Feel free to use this README file for your project, ensuring it accurately reflects the structure and technologies you've implemented.