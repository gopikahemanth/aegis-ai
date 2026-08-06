# Architecture: AegisArtGallery

## 1. System Overview
AegisArtGallery is a responsive React-based digital catalog designed for high-fidelity art asset management and exhibition curation. The system emphasizes performance, modular UI component isolation, and immutable data flow to ensure a seamless experience for gallery administrators and art enthusiasts.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (images, fonts, global styles)
├── components/      # Atomic UI elements (Button, GalleryCard, Modal)
├── hooks/           # Shared logic (useAuth, useGalleryFetch)
├── layouts/         # Page scaffolding (Header, Sidebar, Footer)
├── pages/           # Route-level views (Home, ExhibitDetail, Upload)
├── services/        # API interaction layers (axios clients, endpoints)
├── store/           # Global state management configuration
├── utils/           # Helper functions (formatters, validators)
└── App.js           # Main entry and router configuration
```

## 3. Key Design Decisions
*   **React (Functional Components + Hooks):** Chosen for a declarative UI paradigm and superior performance via component-level state isolation.
*   **Axios:** Selected for its robust request/response interceptor support, critical for injecting authentication tokens and standardizing error handling.
*   **CSS Modules:** Implemented to avoid global scope pollution and ensure component-level style encapsulation.
*   **React Router:** Utilized for declarative client-side routing to support complex nested gallery navigation without full page reloads.

## 4. Data Flow
1.  **Action:** User triggers an event (e.g., clicking an artwork).
2.  **Dispatch:** A React hook or action creator invokes a service function.
3.  **Transport:** The `service` layer performs an asynchronous API request using Axios.
4.  **Update:** The response data is normalized and dispatched to the global `store` (Context/Redux).
5.  **Render:** React detects state changes and re-renders components subscribed to the updated data slices.

## 5. State Management Approach
The application employs a hybrid strategy:
*   **Global State (Context API/Redux):** Used for session data, user authentication, and critical gallery metadata that must persist across page navigation.
*   **Local State (`useState`/`useReducer`):** Used for transient UI concerns such as input field values, modal visibility, and specific view toggles to minimize unnecessary re-renders.

## 6. Error Handling Strategy
*   **Global Boundary:** A top-level `ErrorBoundary` component catches runtime rendering exceptions to prevent white-screen crashes.
*   **Service-Level Interceptors:** Axios interceptors capture non-2xx HTTP responses, automatically triggering user-facing notifications via a toast system.
*   **Validation:** Input sanitization and form validation (using Zod or similar schemas) are performed client-side prior to network transmission to reduce server load.