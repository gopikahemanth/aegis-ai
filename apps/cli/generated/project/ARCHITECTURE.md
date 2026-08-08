# Architecture: resume-keyword-scanner

## 1. System Overview
The `resume-keyword-scanner` is a full-stack web application designed to parse resumes and extract relevant keywords against job descriptions. It utilizes a React-based frontend for user interaction and a Node/Express backend to orchestrate document analysis and authentication-protected user sessions.

## 2. Folder Structure
```text
├── server/
│   ├── controllers/      # Business logic (auth, analysis)
│   ├── middleware/       # Request interception (JWT validation)
│   └── routes/           # API endpoint definitions
├── src/
│   ├── components/       # UI building blocks
│   └── App.tsx           # Root component & routing entry
└── package.json
```

## 3. Key Design Decisions
*   **React (Frontend):** Selected for its component-based architecture, enabling modular UI development for file uploads and analysis result visualization.
*   **Express (Backend):** Chosen for its minimalist, non-opinionated structure, allowing rapid development of RESTful endpoints to bridge the frontend and NLP analysis services.
*   **JWT-based Auth:** Implemented via `auth.middleware.ts` to ensure stateless authentication, allowing the API to remain scalable across distributed instances.
*   **Controller-Route Separation:** Business logic is decoupled from routing (using the controller pattern) to improve unit testability and maintainability.

## 4. Data Flow
1.  **Request Initiation:** The user uploads a resume file via `App.tsx`.
2.  **Authorization:** The request hits `analysis.routes.tsx`, passing through `auth.middleware.ts` to verify the user token.
3.  **Processing:** `analysis.controller.ts` receives the file, triggers the parsing logic, and extracts keywords.
4.  **Persistence/Response:** Processed results are returned to the frontend; if applicable, session-specific metadata is persisted to the database.
5.  **Rendering:** The frontend receives the JSON payload and updates the UI state to display the keyword analysis.

## 5. State Management Approach
*   **Local State:** React `useState` and `useReducer` hooks are utilized for ephemeral UI states (loading spinners, form inputs, and validation messages).
*   **Server State:** React Query (or similar fetch-based caching) is recommended to manage asynchronous server state, ensuring cache invalidation and reduced redundant API calls for analysis results.

## 6. Error Handling Strategy
*   **Middleware Catch-all:** A global error-handling middleware in the Express server captures unhandled exceptions and standardizes error responses (status code + error message).
*   **Frontend Interceptors:** API calls are wrapped in `try/catch` blocks (or async/await wrappers) to catch network failures or 4xx/5xx responses.
*   **Graceful Degradation:** Users are notified via Toast notifications or UI-embedded error messages when an analysis process fails or authentication expires.