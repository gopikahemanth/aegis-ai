# Architecture Documentation: AegisArtGallery

## 1. System Overview
AegisArtGallery is a responsive React-based digital catalog platform designed for high-fidelity art visualization. The system emphasizes performance-oriented media loading, client-side filtering, and a modular component architecture to ensure maintainability for gallery curators.

## 2. Folder Structure
```text
src/
├── assets/         # Static global assets (fonts, icons, themes)
├── components/     # Atomic design components (UI elements)
├── features/       # Domain-specific modules (Gallery, Auth, Search)
├── hooks/          # Shared custom React hooks
├── services/       # API abstraction layer (Axios/Fetch configs)
├── store/          # Global state definitions (Zustand)
├── utils/          # Pure helper functions and constants
└── App.jsx         # Main entry point and route configuration
```

## 3. Key Design Decisions
*   **Framework (React):** Chosen for its extensive ecosystem and efficient Virtual DOM, critical for handling large image grids.
*   **State Management (Zustand):** Selected over Redux/Context for its minimal boilerplate and performant subscription model, ideal for medium-scale gallery state.
*   **Styling (Tailwind CSS):** Implemented for rapid, utility-first UI development and consistent design system enforcement.
*   **API Layer (Axios):** Used to centralize interceptors for authentication tokens and standardized error handling.

## 4. Data Flow
1.  **User Action:** User interacts with UI (e.g., clicks a category filter).
2.  **Dispatch:** Action triggers a function within the `features/` layer.
3.  **Service/Async:** The service layer calls the backend REST API.
4.  **State Update:** The Zustand store receives the payload and updates the global application state.
5.  **Re-render:** React detects state changes and triggers a surgical re-render of the gallery grid components.

## 5. State Management Approach
The application follows a **"Global + Local" hybrid model**:
*   **Global State (Zustand):** Reserved for cross-cutting concerns like user authentication, active gallery filters, and shopping cart data.
*   **Local State (React `useState`/`useReducer`):** Used strictly for component-scoped concerns, such as local input validation, toggle states, and UI animations.

## 6. Error Handling Strategy
*   **Global Boundary:** React `ErrorBoundary` wraps the top-level route configuration to capture and log UI crashes without unmounting the entire application.
*   **API Layer:** Axios interceptors provide a centralized point to catch 4xx/5xx status codes, dispatching toasts or user notifications via the global state.
*   **Validation:** Use of Schema validation (e.g., Zod) on forms to provide immediate feedback before requests reach the service layer.