# ARCHITECTURE.md: Aegis-Expense-Tracker

## 1. System Overview
Aegis-Expense-Tracker is a high-performance financial management dashboard built with React and Vite. The system utilizes a modular architecture to ensure separation of concerns between the client-side presentation layer and the Node/Express backend, providing secure expense tracking and analytics.

## 2. Folder Structure
```text
/
├── client/              # React/Vite Frontend
│   ├── src/
│   │   ├── components/  # Atomic UI components
│   │   ├── hooks/       # Custom state/API logic
│   │   ├── store/       # State management configuration
│   │   └── services/    # API interaction layer
├── server/              # Node.js Backend
│   ├── index.ts         # Express server entry point
│   ├── routes/          # API endpoint definitions
│   └── controllers/     # Business logic layer
└── shared/              # TypeScript interfaces/types
```

## 3. Key Design Decisions
*   **React + Vite:** Chosen for rapid HMR (Hot Module Replacement) and optimized production builds via Rollup.
*   **TypeScript:** Enforced across the full stack to ensure type safety and reduce runtime errors in financial calculations.
*   **Express (Node.js):** Provides a lightweight, scalable middleware layer for handling RESTful API requests.
*   **Axios:** Used for consistent HTTP client configuration, including interceptors for authentication tokens.

## 4. Data Flow
1.  **Initiation:** User interacts with the UI, triggering an action (e.g., submitting an expense).
2.  **Dispatch:** Frontend state (Zustand/Context) triggers an async service call.
3.  **Transmission:** Axios sends the request to the `server/index.ts` endpoint.
4.  **Processing:** Controller validates the payload, performs business logic, and interacts with the database.
5.  **Response:** Server returns a JSON response; the frontend updates the local state, triggering a reactive UI re-render.

## 5. State Management Approach
*   **Global State:** Managed via **Zustand** for lightweight, boilerplate-free state updates.
*   **Server State:** Handled via **TanStack Query (React Query)** to manage caching, background re-fetching, and loading/error states for API data.
*   **Local State:** Standard `useState` and `useReducer` hooks for component-specific ephemeral UI state.

## 6. Error Handling Strategy
*   **Backend:** Global Express error-handling middleware catches uncaught exceptions and returns standardized ` { error: string, code: number }` responses.
*   **Frontend:**
    *   **Boundary:** React Error Boundaries wrap critical UI sections to prevent full-app crashes.
    *   **API:** Axios interceptors catch 4xx/5xx status codes, logging telemetry and triggering global notification toasts via the UI layer.