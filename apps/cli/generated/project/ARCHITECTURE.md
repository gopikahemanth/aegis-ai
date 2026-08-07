# Architecture: Aegis-Expense-Tracker

## 1. System Overview
Aegis-Expense-Tracker is a high-performance React application designed for real-time financial tracking and expense categorization. It leverages a modular component architecture to ensure maintainability, scalability, and a reactive user experience.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (images, global styles)
├── components/      # Reusable UI primitives (Buttons, Inputs, Cards)
├── features/        # Feature-based modules (Dashboard, Expenses, Auth)
├── hooks/           # Custom React hooks for shared logic
├── services/        # API clients and external service integrations
├── store/           # Global state configuration (Redux/Zustand)
├── utils/           # Helper functions and constants
└── App.jsx          # Root component and application routing
```

## 3. Key Design Decisions
*   **Feature-First Directory Pattern:** Organizes code by functional domain rather than file type to reduce context switching and improve modularity.
*   **Zustand for State:** Chosen over Redux for its minimal boilerplate, high performance, and ease of use in managing transient application state.
*   **Tailwind CSS:** Utilized for utility-first styling to ensure design consistency and reduce bundle size compared to traditional CSS-in-JS solutions.
*   **Axios with Interceptors:** Centralizes HTTP request logic to handle authentication tokens and global error logging consistently.

## 4. Data Flow
1.  **User Action:** An interaction (e.g., submitting an expense) triggers a handler in a feature component.
2.  **Service Layer:** The handler invokes a method from the `services/` layer, which communicates with the backend API.
3.  **State Update:** Upon successful response, the local or global state (Zustand) is updated.
4.  **Re-render:** React detects the state mutation and triggers a re-render of the relevant components to reflect the new data.

## 5. State Management Approach
The application employs a two-tier state strategy:
*   **Server State:** Managed via `TanStack Query` (React Query) to handle caching, background refetching, and synchronization of remote API data.
*   **UI/Global State:** Managed via `Zustand` for non-server state (e.g., theme toggle, sidebar visibility, user preferences) to keep the global store lean and performant.

## 6. Error Handling Strategy
*   **Boundary Layers:** React Error Boundaries are implemented at the route level to prevent entire application crashes during component-specific failures.
*   **Global Interceptors:** Axios interceptors catch 4xx/5xx status codes and redirect to an error logging service or display user-friendly Toast notifications.
*   **Validation:** Schema validation is enforced using `Zod` on all form inputs and API responses to ensure data integrity before state processing.