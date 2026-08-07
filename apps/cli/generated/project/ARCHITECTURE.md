# Architecture.md: AegisExpenseTracker

## 1. System Overview
AegisExpenseTracker is a high-performance React-based financial management application designed for real-time expense tracking and budget visualization. The system utilizes a modular, component-driven architecture to ensure maintainability, scalability, and a responsive user experience across devices.

## 2. Folder Structure
```text
/src
├── assets/          # Static assets (images, global CSS)
├── components/      # Reusable UI primitives (Button, Input, Card)
├── features/        # Domain-specific modules (Dashboard, ExpenseList, Auth)
├── hooks/           # Custom React hooks for shared logic
├── services/        # API integration and external data handling
├── store/           # Global state configuration (Redux/Zustand slices)
├── utils/           # Helper functions and constants
└── App.jsx          # Main entry point and routing configuration
```

## 3. Key Design Decisions
*   **React (Vite):** Chosen for rapid development, optimized build times, and a rich ecosystem of libraries.
*   **Feature-First Organization:** Folders are organized by domain (e.g., `features/ExpenseList`) rather than technical type to improve code locality and developer velocity.
*   **Axios:** Used for HTTP client capabilities due to robust interceptor support for authentication headers and error handling.
*   **Tailwind CSS:** Selected for utility-first styling to ensure design consistency and reduced CSS bundle sizes.

## 4. Data Flow
1.  **User Action:** User submits an expense form via a component in `features/`.
2.  **State Update:** The component triggers an action that updates the local state via a custom hook or store dispatcher.
3.  **Persistence:** The `services/` layer sends an asynchronous request to the backend API.
4.  **Revalidation:** Upon success, the store is updated with the new dataset, triggering a re-render of observer components to reflect the current balance.

## 5. State Management Approach
*   **Global State:** Managed via [Zustand/Redux Toolkit] for cross-feature accessibility (e.g., user authentication, global transaction list).
*   **Server State:** Handled via React Query (TanStack Query) to manage caching, background fetching, and synchronization between the client and server.
*   **Local State:** Restricted to component-level concerns (e.g., form inputs, dropdown toggles) using `useState` and `useReducer`.

## 6. Error Handling Strategy
*   **API Layer:** Centralized interceptors in the `services/` layer catch HTTP 4xx/5xx responses to log errors and trigger global alerts.
*   **UI Layer:** Implementation of `ErrorBoundary` components wrapped around major features to prevent white-screen crashes.
*   **User Feedback:** Toast notifications and inline validation feedback are used to provide immediate, actionable context for failed operations or invalid inputs.