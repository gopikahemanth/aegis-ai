# Architecture: Aegis-Expense-Tracker

## 1. System Overview
Aegis-Expense-Tracker is a high-performance web application built with React and Vite designed for real-time financial tracking. The system focuses on modularity and type safety to ensure robust data integrity for user-managed expense records.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (images, fonts, global styles)
├── components/      # Reusable UI components (atoms, molecules)
├── context/         # React Context providers for global state
├── hooks/           # Custom React hooks for business logic
├── services/        # API interaction layers and external utilities
├── utils/           # Pure helper functions and constants
├── App.tsx          # Root component and application routing
└── main.tsx         # Entry point and DOM initialization
```

## 3. Key Design Decisions
*   **Vite:** Selected over CRA for faster HMR (Hot Module Replacement) and optimized production builds via Rollup.
*   **Functional Components & Hooks:** Mandated to favor composition over inheritance and to ensure predictable lifecycle management.
*   **Context API:** Utilized for lightweight global state (User Auth, Theme) to avoid the overhead of heavy external libraries like Redux.
*   **Service Layer Pattern:** Encapsulates API calls within `services/` to decouple business logic from component implementation.

## 4. Data Flow
1.  **Input:** User interacts with UI components, triggering event handlers.
2.  **Logic:** Hooks process input, validating data against local schemas.
3.  **Persistence:** Services communicate with the backend API or LocalStorage to persist state.
4.  **Reconciliation:** Upon successful mutation, state updates trigger a re-render of components subscribed to the updated context/state, reflecting changes in the UI.

## 5. State Management
*   **Local State:** Managed via `useState` and `useReducer` for component-specific data.
*   **Global State:** Managed via `React Context` to provide dependency injection of application-wide data (authentication status, currency preferences). 
*   **Derived State:** Computed dynamically within components or memoized via `useMemo` to prevent unnecessary recalculations.

## 6. Error Handling Strategy
*   **Boundary Layers:** Use `Error Boundaries` to catch JavaScript errors in the component tree, preventing full app crashes.
*   **API Resilience:** Centralized response interceptors in `services/` to standardize error formatting and trigger global alerts (e.g., toast notifications).
*   **Validation:** Input-level validation via schema checkers before data transmission to ensure data integrity and minimize server-side rejection.