# Architecture: AegisExpenseTracker

## 1. System Overview
AegisExpenseTracker is a high-performance React-based financial management application designed for real-time transaction tracking and analytical reporting. The architecture prioritizes modularity and type safety to ensure long-term maintainability and consistent state synchronization across the client-side lifecycle.

## 2. Folder Structure
```text
/src
├── assets/          # Static assets (images, global CSS)
├── components/      # Atomic UI components (Buttons, Inputs, Cards)
├── features/        # Domain-specific modules (Dashboard, Transactions, Auth)
├── hooks/           # Reusable custom React hooks
├── services/        # API client configurations and external service integrations
├── store/           # Global state slices and persistence configuration
├── types/           # Global TypeScript interfaces and type definitions
├── utils/           # Pure helper functions and formatting logic
└── App.tsx          # Root component and provider composition
```

## 3. Key Design Decisions
*   **React + TypeScript:** Selected for compile-time type safety and enhanced developer experience during refactoring of financial models.
*   **Feature-based Directory Structure:** Decouples domain logic (e.g., Transactions vs. Auth) to prevent "spaghetti" imports as the codebase scales.
*   **Tailwind CSS:** Chosen for utility-first styling to ensure design consistency and minimize CSS bundle size.
*   **Zustand:** Chosen over Redux for global state due to its minimal boilerplate and superior performance for medium-scale reactive state.

## 4. Data Flow
1.  **Initiation:** User interacts with a component (e.g., `AddTransactionForm`).
2.  **Processing:** The form triggers a validation schema (Zod) and calls a service method.
3.  **Persistence:** The service performs an asynchronous request to the API. 
4.  **Sync:** Upon success, the service updates the global `store` (Zustand).
5.  **Re-render:** React observers detect the store mutation, triggering a granular re-render of components subscribed to that specific state slice.

## 5. State Management
*   **Server State:** Managed via React Query (TanStack Query) to handle caching, background refetching, and request deduping.
*   **Client/UI State:** Managed via Zustand for ephemeral data (e.g., modal visibility, filter parameters) that does not need server synchronization.
*   **Persistence:** Sensitive settings are persisted to `localStorage` using Zustand middleware for persistent state across sessions.

## 6. Error Handling Strategy
*   **Boundary Layers:** Global `ErrorBoundary` components capture unexpected runtime UI crashes to prevent white-screen failures.
*   **Service Layer:** Centralized `Axios` interceptors catch network errors, formatting them into standardized application error objects.
*   **User Feedback:** Toast notifications are triggered via a centralized notification store, providing immediate visual feedback for failed operations (e.g., network timeout, validation error).