# Architecture: AegisFitnessTracker

## 1. System Overview
AegisFitnessTracker is a React-based performance monitoring application designed for real-time tracking of fitness metrics and historical analytics. The architecture leverages a modular component structure to ensure high reusability, maintainability, and a seamless user experience across dashboard and data-logging views.

## 2. Folder Structure
```text
src/
├── assets/         # Static assets (images, fonts, global styles)
├── components/     # Reusable UI primitives (Buttons, Inputs, Cards)
├── features/       # Domain-specific logic (e.g., workout-tracking, user-profile)
├── hooks/          # Shared custom React hooks for side-effects and data fetching
├── layouts/        # Global page shells and navigation containers
├── services/       # API clients and external integration configurations
├── store/          # Global state management configuration
├── utils/          # Pure helper functions and constants
└── types/          # Global TypeScript interfaces and type definitions
```

## 3. Key Design Decisions
*   **React (Vite):** Selected for rapid development, optimal build performance, and an extensive ecosystem of performance-monitoring libraries.
*   **TypeScript:** Enforced throughout the codebase to ensure type safety, reduce runtime errors, and improve developer velocity through robust IDE intellisense.
*   **TanStack Query:** Chosen for data synchronization to manage server state, caching, and background revalidation without complex boilerplate.
*   **Tailwind CSS:** Utilized for utility-first styling to ensure a consistent design system while minimizing bundle size compared to traditional CSS-in-JS libraries.

## 4. Data Flow
1.  **User Action:** User interacts with a component (e.g., submits a workout log).
2.  **Service Call:** The component triggers a function in `services/`, which interacts with the backend API.
3.  **State Mutation:** On success, the TanStack Query mutation invalidates relevant queries, triggering a background fetch of updated data.
4.  **UI Update:** The React state reacts to the cache invalidation, re-rendering components with the latest data from the API.

## 5. State Management Approach
*   **Server State:** Managed exclusively via **TanStack Query** (React Query) to handle caching, loading states, and error retries.
*   **Client State:** Local component-level state is managed via `useState`. Global UI state (e.g., theme, sidebar toggles) is managed via **Zustand** due to its minimal footprint and lack of boilerplate compared to Redux.

## 6. Error Handling Strategy
*   **Boundary Layer:** `ErrorBoundary` components wrap major feature modules to prevent cascading application crashes.
*   **API Layer:** Centralized Axios interceptors handle global HTTP error codes (401, 403, 500) and trigger appropriate toast notifications or redirection.
*   **Validation Layer:** Zod is used for schema validation on all form inputs and API responses, ensuring data integrity before processing.