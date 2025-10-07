# Project Documentation

## Setup and Run

This project consists of a React frontend and a Node.js backend. To get the project running locally, follow these steps:

### Prerequisites

- Node.js and npm installed on your machine.

### Installation

1.  **Install frontend dependencies:**
    Open a terminal in the root directory of the project and run:
    ```bash
    npm install
    ```

2.  **Install backend dependencies:**
    Navigate to the `backend` directory and install its dependencies:
    ```bash
    cd backend
    npm install
    cd ..
    ```

### Running the Application

To start both the frontend development server and the backend server concurrently, run the following command from the root directory:

```bash
npm run dev
```

This will:
- Start the React development server (usually on `http://localhost:3000`).
- Start the backend server (usually on `http://localhost:3001`).

## Project Structure

This project is a monorepo containing both the frontend and backend code.

### Frontend (`src` directory)

The frontend is a React application built with Create React App. The main directories are:

-   **`src/components`**: Contains reusable React components used throughout the application. These are further organized by feature (e.g., `chat`, `home`, `notes`).
-   **`src/pages`**: Each file in this directory represents a page or a view in the application (e.g., `LandingPage.js`, `TutorPage.js`).
-   **`src/context`**: Holds React context providers for managing global state, such as user authentication or application-wide settings.
-   **`src/utils`**: Includes utility functions, such as API helpers for making requests to the backend.
-   **`src/styles`**: Contains global CSS styles and variables.

### Backend (`backend` directory)

The backend is a Node.js application using the Express framework. It handles business logic, API endpoints, and database interactions.

-   **`backend/src/config`**: Configuration files for aspects like environment variables, logging, and database connections.
-   **`backend/src/controllers`**: Handles incoming requests, processes them, and sends back responses. They act as the bridge between routes and services.
-   **`backend/src/services`**: Contains the core business logic of the application. Services are called by controllers to perform specific tasks (e.g., fetching data from a database, interacting with external APIs).
-   **`backend/src/routes`**: Defines the API endpoints and maps them to the appropriate controller functions.
-   **`backend/src/middleware`**: Express middleware for tasks like authentication, error handling, and logging.
-   **`backend/prisma`**: Contains the Prisma schema (`schema.prisma`) for database modeling and migrations.

## API Documentation

The backend provides a RESTful API for all frontend operations. The API documentation is generated using Swagger and is available at the following endpoint when the backend server is running:

**[http://localhost:3001/api-docs](http://localhost:3001/api-docs)**

This interactive documentation allows you to explore all available endpoints, view their request and response schemas, and even test them directly from your browser.

## Core Features

### 1. AI Tutor

The AI Tutor is a conversational chat interface that provides students with guidance and support for their problems.

**How it Works:**

1.  **Initiating a Chat**: A user can start a conversation from the "Tutor" page. If the chat is initiated from a specific problem, the initial context of the problem is sent to the AI.
2.  **Real-time Interaction**: The chat interface uses Server-Sent Events (SSE) to stream the AI's response in real-time, providing a dynamic and interactive experience.
3.  **Backend Logic**:
    *   The `chatService.ts` on the backend manages the chat logic.
    *   When a user sends a message, it's added to a chat thread in the database.
    *   The backend then uses the OpenAI API to generate a response based on the conversation history.
    *   The service dynamically selects the most appropriate GPT model (`gpt-4o-mini` or `gpt-4o`) based on the conversation's length and complexity to balance cost and performance.
    *   The response is streamed back to the client in chunks.
4.  **Frontend Implementation**:
    *   The `ChatPanel.js` component manages the chat UI and state.
    *   It establishes an SSE connection to the backend to receive the AI's response.
    *   As chunks of the response are received, they are appended to the currently displayed message, creating a "typing" effect.
    *   Once the stream is complete, the full message is displayed.

### 2. Notes Hub

The Notes Hub is a central place for users to save and organize various types of content, including problems, solutions, hints, and concept notes.

**How it Works:**

1.  **Saving Items**: Users can save items from various parts of the application. Each saved item is stored in the database and associated with the user.
2.  **Organization**:
    *   **Folders**: Users can create folders to organize their saved items. Items can be moved between folders via drag-and-drop.
    *   **Starring**: Important items can be "starred" for quick access.
    *   **Filtering and Searching**: The Notes Hub provides robust filtering options by type, subject, difficulty, and tags. A search bar allows for full-text search across all saved items.
3.  **Frontend Implementation**:
    *   **`NotesHubPage.js`**: This is the main page component that orchestrates the entire feature. It fetches data from the backend, manages state for filters, search queries, and modals, and renders the list of saved items.
    *   **`SavedItemCard.js`**: This component is responsible for displaying a single saved item. It shows the item's title, excerpt, tags, and provides actions like starring, deleting, and opening the item for review.
    *   **`FolderSidebar.js`**: This component displays the list of folders and allows users to navigate between them. It also handles the drag-and-drop functionality for moving items into folders.
4.  **Backend Logic**:
    *   The backend provides API endpoints for creating, reading, updating, and deleting saved items and folders.
    *   The `savedItemsController.ts` and `foldersController.ts` handle the API requests.
    *   The data is stored in the database using Prisma.

### 3. Problem Solving

The "Solve Problems" page is where users can input new problems and receive AI-generated solutions, hints, and concept notes.

**How it Works:**

1.  **Problem Input**: Users can either type a problem directly or upload an image or PDF of a problem.
2.  **AI Content Generation**:
    *   Once a problem is submitted, the user can choose to generate a step-by-step solution, a series of hints, or a set of concept notes related to the problem.
    *   The backend receives the request and uses the OpenAI API to generate the requested content.
    *   The generated content is then displayed to the user.
3.  **Frontend Implementation**:
    *   **`SolveProblemsPage.js`**: This page manages the entire problem-solving workflow. It handles the state for the problem input, the selected subject, and the display of the generated content. It also orchestrates the API calls to the backend.
    *   **`SolutionDisplay.js`**, **`HintsDisplay.js`**, and **`ConceptNotesDisplay.js`**: These components are responsible for rendering the AI-generated solutions, hints, and concept notes, respectively.
4.  **Backend Logic**:
    *   The `problemsController.ts` handles the API requests for creating problems and generating content.
    *   The `openaiService.ts` (which is used by the `chatService.ts` and other services) is responsible for interacting with the OpenAI API to generate the solutions, hints, and concept notes.
    *   The generated content is saved to the database and associated with the problem.
