# Architecture Documentation: ResuMatch AI

## 1. System Overview
ResuMatch AI is a React-based web application designed to optimize job application processes by matching user resumes against specific job descriptions. The system leverages a client-side heavy architecture with a secure API integration layer to perform AI-driven analysis and document parsing.

## 2. Folder Structure
```text
src/
├── assets/           # Static resources (images, global styles)
├── components/       # Reusable UI primitives (buttons, inputs)
├── features/         # Domain-specific modules (ResumeUpload, JobMatcher)
│   ├── auth/         # Authentication and user session logic
│   └── matcher/      # Core logic for resume/job parsing
├── hooks/            # Custom React hooks for API and state logic
├── services/         # Axios/Fetch instances and API layer
├── store/            # Global state management (Zustand)
├── utils/            # Shared helper functions and constants
└── App.tsx           # Main entry point and provider wrapping
```

## 3. Key Design Decisions
*   **React (Vite):** Selected for rapid development, HMR support, and a robust ecosystem for complex form handling.
*   **Zustand:** Chosen over Redux for a minimalist, boilerplate-free state management approach that reduces bundle size.
*   **Tailwind CSS:** Utilized for utility-first styling to ensure consistent UI scaling and improved design velocity.
*   **React Query (TanStack Query):** Implemented for server-state caching, automatic background refetching, and simplified loading/error states.

## 4. Data Flow
1.  **Input:** User uploads resume (PDF/DOCX) via `ResumeUpload` component.
2.  **Processing:** Client-side validation occurs before triggering a `useMutation` hook.
3.  **Transit:** Data is sent to the backend API via the `services/` layer with JWT authentication headers.
4.  **Storage:** The AI service parses the data and returns structured JSON; the client updates the Zustand store.
5.  **View:** Components subscribed to the store trigger a re-render to display match metrics.

## 5. State Management Approach
*   **Server State:** Managed by **TanStack Query** to handle API caching, loading states, and error retries.
*   **Client Global State:** Managed by **Zustand** for non-persistent UI configuration (e.g., active step in a wizard, current theme, or filtered resume states).
*   **Local State:** Kept within individual components using `useState` or `useReducer` for ephemeral inputs (e.g., form field keystrokes).

## 6. Error Handling Strategy
*   **Boundary Layers:** Global `ErrorBoundary` components catch React rendering crashes to prevent blank screens.
*   **API Interceptors:** Axios response interceptors handle global 401 (re-authentication) and 500-series (server-side) errors.
*   **User Feedback:** Toast notifications (via `react-hot-toast`) provide immediate visual feedback for failed operations or invalid file uploads.
*   **Graceful Degradation:** Feature-flagging/conditional rendering ensures essential UI elements remain functional even if auxiliary AI features experience latency.