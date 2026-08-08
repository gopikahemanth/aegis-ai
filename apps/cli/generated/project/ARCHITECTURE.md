# Architecture: Aegis Resume Optimizer

## 1. System Overview
Aegis Resume Optimizer is a React-based single-page application (SPA) designed to parse, analyze, and improve user resumes against specific job descriptions. The system leverages client-side processing for file extraction and backend integration for AI-driven optimization, providing real-time feedback to users.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (icons, fonts, images)
├── components/      # Atomic UI components (Buttons, Inputs, Cards)
├── hooks/           # Shared custom React hooks (useAuth, useResume)
├── services/        # API clients and external integration logic
├── store/           # Global state definitions (Zustand/Context)
├── utils/           # Helper functions (parsing logic, validators)
├── views/           # Page-level components
└── App.tsx          # Application entry point and routing
```

## 3. Key Design Decisions
*   **React (Vite):** Chosen for fast development cycles and high-performance Hot Module Replacement (HMR).
*   **Zustand:** Selected over Redux for state management due to its minimal boilerplate and superior performance for localized state updates.
*   **Axios:** Used for robust HTTP request handling with built-in interceptors for JWT injection.
*   **Tailwind CSS:** Enables rapid UI development and ensures design consistency via a utility-first approach.

## 4. Data Flow
1.  **Input:** User uploads a PDF/DOCX via the `UploadComponent`.
2.  **Processing:** File is sent to the `services/resumeService`, which handles multi-part form data transmission to the backend.
3.  **Persistence:** The backend processes the file, returns optimized data, and updates the database.
4.  **Retrieval:** The frontend receives a JSON response; the application state is updated, triggering a re-render of the `AnalysisView`.
5.  **Synchronization:** Local state is periodically synced with the backend to ensure data integrity.

## 5. State Management Approach
The application utilizes a **hybrid state strategy**:
*   **Global State (Zustand):** Used for cross-component data such as `userSession`, `currentResumeData`, and `optimizationResults`.
*   **Local State (React `useState`/`useQuery`):** Used for ephemeral UI states, such as form inputs, loading spinners, and component-specific toggle states.
*   **Server State (TanStack Query):** Handles caching, background refetching, and stale-while-revalidate patterns for resume optimization results.

## 6. Error Handling Strategy
*   **Boundary Layers:** Global `ErrorBoundary` components prevent application-wide crashes during rendering failures.
*   **API Layer:** Axios interceptors catch 4xx/5xx responses, mapping them to human-readable error messages displayed via a centralized Toast notification system.
*   **Validation:** Client-side Zod schemas validate user inputs before requests are dispatched, preventing malformed data from hitting the API.
*   **Logging:** Errors are captured and reported via Sentry for post-mortem analysis.