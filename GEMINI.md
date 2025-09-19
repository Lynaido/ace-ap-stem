# Project: AAS App

## Project Overview

This is a web application built with React. It appears to be an educational application for students, with features like solving problems, a tutor, a notes hub, and a study mode. The application uses React Router for navigation and a context-based approach for state management.

### Key Technologies

*   **Frontend:** React, React Router
*   **State Management:** React Context with a useReducer pattern
*   **Styling:** CSS

## Building and Running

To get the application running locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm start
    ```
    This will start the application in development mode and open it in your browser at [http://localhost:3000](http://localhost:3000).

3.  **Run Tests:**
    ```bash
    npm test
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```

## Development Conventions

*   **Component-Based Architecture:** The application is structured around React components, which are organized into folders by feature (e.g., `chat`, `home`, `notes`).
*   **State Management:** Global application state is managed using React's Context API and a `useReducer` hook, as seen in `src/context/AppContext.js`.
*   **Routing:** The application uses `react-router-dom` for client-side routing, with routes defined in `src/App.js`.
*   **Styling:** Components are styled with CSS files that are co-located with the component files.
