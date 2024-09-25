# Backend API Documentation

This document outlines the backend API endpoints for the project. It is intended to assist in the design and development of the frontend by providing detailed information about each available API endpoint.

## Base URL

All API endpoints are accessible via the base URL:

```
http://<server-domain-or-ip>:<port>
```

The default port is **3001** unless specified otherwise in the environment configuration.

---

## Table of Contents

- [Backend API Documentation](#backend-api-documentation)
  - [Base URL](#base-url)
  - [Table of Contents](#table-of-contents)
  - [Projects](#projects)
    - [Create a New Project](#create-a-new-project)
    - [Get All Projects](#get-all-projects)
  - [Files](#files)
    - [Create a New File in a Project](#create-a-new-file-in-a-project)
    - [Get All Files in a Project](#get-all-files-in-a-project)
    - [Get a Specific File's Content](#get-a-specific-files-content)
    - [Delete a File in a Project](#delete-a-file-in-a-project)
  - [Commands](#commands)
    - [Apply Command to a Specific File](#apply-command-to-a-specific-file)
    - [Apply Command to All Files in a Project](#apply-command-to-all-files-in-a-project)
  - [Templates](#templates)
    - [Get a List of Available Templates](#get-a-list-of-available-templates)
    - [Get a Specific Template](#get-a-specific-template)
  - [Additional Notes](#additional-notes)
    - [Content Types](#content-types)
    - [Error Handling](#error-handling)
    - [Rate Limiting](#rate-limiting)
    - [CORS Configuration](#cors-configuration)
    - [OpenAI Integration](#openai-integration)
    - [Command Types and Operations](#command-types-and-operations)
    - [File Content Handling](#file-content-handling)
    - [Project and File Identifiers](#project-and-file-identifiers)

---

## Projects

### Create a New Project

**Endpoint**

```
POST /api/project
```

**Description**

Creates a new project.

**Request Body**

```json
{
  "name": "string"  // The name of the project
}
```

**Response**

- **201 Created**

  ```json
  {
    "projectId": "string",  // UUID of the created project
    "name": "string"        // Name of the project
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "errors": [
      {
        "msg": "Project name is required",
        "param": "name",
        "location": "body"
      }
    ]
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to create project."
  }
  ```

---

### Get All Projects

**Endpoint**

```
GET /api/project
```

**Description**

Retrieves a list of all existing projects.

**Response**

- **200 OK**

  ```json
  {
    "projects": [
      {
        "projectId": "string",
        "name": "string"
      },
      // Additional projects...
    ]
  }
  ```

**Errors**

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to fetch projects."
  }
  ```

---

## Files

### Create a New File in a Project

**Endpoint**

```
POST /api/project/{projectId}/files
```

**Description**

Creates a new file within a specified project.

**Path Parameters**

- `projectId`: UUID of the project where the file will be created.

**Request Body**

```json
{
  "name": "string"  // The name of the file
}
```

**Response**

- **201 Created**

  ```json
  {
    "fileId": "string",  // UUID of the created file
    "name": "string"     // Name of the file
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "errors": [
      {
        "msg": "File name is required",
        "param": "name",
        "location": "body"
      }
    ]
  }
  ```

- **404 Not Found**

  ```json
  {
    "message": "Project not found."
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to create file."
  }
  ```

---

### Get All Files in a Project

**Endpoint**

```
GET /api/project/{projectId}/files
```

**Description**

Retrieves all files within a specified project.

**Path Parameters**

- `projectId`: UUID of the project.

**Response**

- **200 OK**

  ```json
  {
    "files": [
      {
        "fileId": "string",
        "name": "string"
      },
      // Additional files...
    ]
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "errors": [
      // Validation errors
    ]
  }
  ```

- **404 Not Found**

  ```json
  {
    "message": "Project not found."
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to fetch files."
  }
  ```

---

### Get a Specific File's Content

**Endpoint**

```
GET /api/project/{projectId}/files/{fileId}
```

**Description**

Retrieves the content of a specific file within a project.

**Path Parameters**

- `projectId`: UUID of the project.
- `fileId`: UUID of the file.

**Response**

- **200 OK**

  ```json
  {
    "fileId": "string",
    "content": "string"  // Markdown content of the file
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "errors": [
      // Validation errors
    ]
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to fetch file content."
  }
  ```

---

### Delete a File in a Project

**Endpoint**

```
DELETE /api/project/{projectId}/files/{fileId}
```

**Description**

Deletes a specific file within a project.

**Path Parameters**

- `projectId`: UUID of the project.
- `fileId`: UUID of the file to be deleted.

**Response**

- **200 OK**

  ```json
  {
    "message": "File deleted successfully."
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "errors": [
      // Validation errors
    ]
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to delete file."
  }
  ```

---

## Commands

### Apply Command to a Specific File

**Endpoint**

```
POST /apply-command/{projectId}/{fileId}
```

**Description**

Applies a command to a specific file within a project. The command can modify the content of the file using various operations.

**Path Parameters**

- `projectId`: UUID of the project.
- `fileId`: UUID of the file.

**Request Body**

```json
{
  "command": "string",       // The command or instructions to apply
  "type": "string"           // (Optional) Type of command (e.g., 'free-form', 'script', 'script-gen')
}
```

**Response**

- **200 OK**

  ```json
  {
    "originalContent": "string",       // Original content before modification
    "modifiedContent": "string",       // Content after applying the command
    "operationsApplied": [             // List of operations applied (if any)
      {
        "type": "string",
        "parameters": {
          // Operation-specific parameters
        }
      }
      // Additional operations...
    ],
    "message": "Success"
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "message": "Invalid input.",
    "errors": [
      // Validation errors
    ]
  }
  ```

- **404 Not Found**

  ```json
  {
    "message": "File not found."
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Error communicating with AI service."
  }
  ```

---

### Apply Command to All Files in a Project

**Endpoint**

```
POST /api/project/{projectId}/apply-command
```

**Description**

Applies a command to all files within a specified project. Useful for batch operations.

**Path Parameters**

- `projectId`: UUID of the project.

**Request Body**

```json
{
  "command": "string",       // The command or instructions to apply to all files
  "type": "string"           // (Optional) Type of command
}
```

**Response**

- **200 OK**

  ```json
  {
    "results": [
      {
        "fileId": "string",
        "status": "Success",
        "data": {
          "originalContent": "string",
          "modifiedContent": "string",
          "operationsApplied": [
            // Operations applied to this file
          ],
          "message": "Success"
        }
      },
      {
        "fileId": "string",
        "status": "Failed",
        "message": "Error message detailing the failure"
      }
      // Results for additional files...
    ]
  }
  ```

**Errors**

- **400 Bad Request**

  ```json
  {
    "message": "Invalid input.",
    "errors": [
      // Validation errors
    ]
  }
  ```

- **404 Not Found**

  ```json
  {
    "message": "Project not found."
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to apply command to all files."
  }
  ```

---

## Templates

### Get a List of Available Templates

**Endpoint**

```
GET /templates
```

**Description**

Retrieves a list of available markdown templates.

**Response**

- **200 OK**

  ```json
  {
    "templates": [
      "templateName1",
      "templateName2"
      // Additional template names...
    ]
  }
  ```

**Errors**

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to retrieve templates."
  }
  ```

---

### Get a Specific Template

**Endpoint**

```
GET /template
```

**Description**

Retrieves the content of a specific template.

**Query Parameters**

- `name`: Name of the template to retrieve.

**Response**

- **200 OK**

  - Returns the template content as plain text (`text/markdown`).

**Errors**

- **400 Bad Request**

  ```json
  {
    "message": "Template name is required"
  }
  ```

- **500 Internal Server Error**

  ```json
  {
    "message": "Failed to retrieve template."
  }
  ```

---

## Additional Notes

### Content Types

- **Request Body:** Must be in JSON format (`application/json`).
- **Response Content-Type:** Typically `application/json`, except when retrieving a template, which returns `text/markdown`.

### Error Handling

- **Validation Errors:** Return `400 Bad Request` with details about invalid parameters.
- **Not Found Errors:** Return `404 Not Found` when resources (projects, files) are not found.
- **Server Errors:** Return `500 Internal Server Error` for unexpected issues.

### Rate Limiting

- The API applies rate limiting to prevent abuse: **60 requests per minute per IP**.
- Exceeding the limit results in a `429 Too Many Requests` response.

### CORS Configuration

- CORS is enabled for specific origins:
  - `http://localhost:8080`
  - `https://gptengineer.app`
- Requests from other origins may be blocked.

### OpenAI Integration

- The `/apply-command` endpoints interact with OpenAI's API.
- Ensure the environment variable `OPENAI_API_KEY` is set for these endpoints to function.

### Command Types and Operations

- **Command Types:**
  - `free-form`: Directly modify the content based on instructions.
  - `script`: Use custom scripts for modifications.
  - `script-gen`: Generate scripts to modify content.
  - `bulk`: Indicates bulk operations (used internally).
- **Available Operations:**
  - `change_heading`: Change the text of specific headings.
  - `emphasize_text`: Emphasize specified text (e.g., bold).
  - `generate_toc`: Generate a Table of Contents.
  - `add_heading_numbering`: Add numbering to headings.
  - `convert_to_doc`: Convert markdown to a `.docx` file.
  - `convert_to_mp3`: Convert markdown content to an MP3 file using TTS.

### File Content Handling

- Files are stored and managed as Markdown (`.md`) files.
- The content can be modified via commands that manipulate the Markdown AST (Abstract Syntax Tree).

### Project and File Identifiers

- Both projects and files are identified using UUIDs.
- These IDs are returned upon creation and used in subsequent API calls.

---

By using this documentation, you can design the frontend to interact seamlessly with the backend services, ensuring proper data flow and error handling. If you have any questions or need further clarification on any endpoint, feel free to reach out.

---

**Note:** Replace `<server-domain-or-ip>` and `<port>` in the base URL with the actual server address and port number where the backend is hosted.