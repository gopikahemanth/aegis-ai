# ARCHITECTURE.md: expense-tracker-pro

## 1. System Overview
Expense-tracker-pro is a high-performance React application designed for real-time financial tracking and visualization. It utilizes a modular, component-based architecture optimized for maintainability, type safety, and seamless asynchronous state synchronization.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (images, global CSS)
├── components/      # Reusable UI primitives (buttons, inputs)
├── features/        # Domain-specific logic (e.g., /transactions, /analytics)
├── hooks/           # Shared custom React hooks
├── services/        # API clients and external service wrappers
├── store/           # Global state definitions (Zustand)
├── utils/           # Pure helper functions and constants
└── types/           # Shared TypeScript interfaces
```

## 3. Key Design Decisions
*   **React (Vite):** Chosen for fast HMR and optimized production builds.
*   **Zustand:** Selected over Redux for its minimal boilerplate, high performance, and simple API, ideal for medium-scale state needs.
*   **TypeScript:** Enforced strictly to ensure type safety across data boundaries and minimize runtime exceptions.
*   **Feature-based Organization:** Collocates logic, hooks, and components within feature folders to improve scalability and maintain "low coupling, high cohesion."

## 4. Data Flow
1.  **User Action:** An event triggers a handler within a feature component.
2.  **API Layer:** The handler invokes a method from `services/` to perform an asynchronous mutation/fetch.
3.  **State Update:** Upon success, the service returns data which is committed to the Zustand global store.
4.  **UI Re-render:** React observers connected to the store detect the state change and re-render only the affected components.

## 5. State Management Approach
The application employs a dual-tier state strategy:
*   **Local State:** Managed via `useState`/`useReducer` for UI-only concerns (e.g., form input toggles, dropdown states).
*   **Global State:** Managed via **Zustand** stores for shared business data (e.g., user authentication, transaction lists, currency preferences). This ensures a single source of truth across the component tree without prop-drilling.

## 6. Error Handling Strategy
*   **API Layer:** Centralized interceptors in `services/` catch HTTP errors, logging them and throwing standardized application errors.
*   **Boundary Layer:** React `ErrorBoundaries` wrap high-level feature modules to prevent full-app crashes, providing user-friendly fallback UIs.
*   **UI Layer:** Form-level validation utilizes schema-based validation (Zod) to intercept errors before data reaches the services layer.