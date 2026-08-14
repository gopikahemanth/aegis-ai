# ARCHITECTURE.md: SentinelCode

## 1. System Overview
SentinelCode is a high-performance administrative interface built on React and Vite, designed for real-time data monitoring and task orchestration. The system prioritizes modularity and type-safety to facilitate rapid feature iteration and maintainability.

## 2. Folder Structure
```text
src/
├── assets/         # Static global assets (images, fonts)
├── components/     # Atomic shared UI components (Button, Input)
├── features/       # Domain-specific modules (e.g., dashboard/)
│   └── dashboard/  # Dashboard domain logic and views
│       ├── api/    # Feature-specific service calls
│       ├── hooks/  # Custom business logic hooks
│       └── DashboardPage.tsx # Feature entry point
├── hooks/          # Global utility hooks
├── store/          # Global application state (Zustand)
└── utils/          # Shared helper functions and constants
```

## 3. Key Design Decisions
*   **Vite:** Selected as the build tool for near-instant HMR and optimized production bundling via Rollup.
*   **TypeScript:** Enforced strictly across the codebase to minimize runtime errors and improve developer ergonomics.
*   **Feature-First Architecture:** Colocation of logic, API, and UI within `features/` prevents "dependency spaghetti" and simplifies module-based refactoring.
*   **Zustand:** Chosen for global state management due to its minimal boilerplate and performance optimization (avoids unnecessary re-renders).

## 4. Data Flow
1.  **Initiation:** User interaction triggers a handler in `DashboardPage.tsx`.
2.  **Service Layer:** The handler calls an API utility from `features/dashboard/api/`.
3.  **State Mutation:** Upon successful resolution, the service returns data which is pushed to the global Zustand store or local component state.
4.  **Reconciliation:** React detects the state update and re-renders the affected components.
5.  **Persistence:** Changes are synced back to the backend via asynchronous `fetch`/`axios` calls encapsulated within service modules.

## 5. State Management Approach
*   **Local State:** Managed via `useState`/`useReducer` for transient UI concerns (e.g., toggle states, form inputs).
*   **Global State:** Managed via Zustand for cross-feature shared data (e.g., User Authentication, Application Settings).
*   **Server State:** Recommended to use `TanStack Query` (React Query) for caching, synchronization, and handling loading/error states of remote data.

## 6. Error Handling Strategy
*   **Boundary Layers:** Use `react-error-boundary` to wrap feature entry points, preventing UI crashes from propagating to the entire application.
*   **Global Catch:** Implement a global Axios/Fetch interceptor to handle HTTP error status codes (401, 403, 500) uniformly.
*   **User Feedback:** Use a shared notification/toast system to expose non-fatal errors to the user while logging details to a centralized monitoring service (e.g., Sentry).