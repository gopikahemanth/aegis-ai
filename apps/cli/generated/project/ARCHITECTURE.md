# Architecture: ATS-Resume-Analyzer

## 1. System Overview
The ATS-Resume-Analyzer is a high-performance React-Vite application designed to parse, extract, and evaluate resume data against job descriptions. It leverages client-side processing for file ingestion and interacts with a backend API to perform semantic matching and ATS optimization.

## 2. Folder Structure
```text
/src
├── assets/          # Static assets (images, fonts, global styles)
├── components/      # Reusable UI primitives (Buttons, Inputs, Cards)
├── features/        # Domain-specific logic (ResumeUpload, JobMatcher, Dashboard)
├── hooks/           # Shared React hooks (useAuth, useLocalStorage, useApi)
├── services/        # API clients and external integration modules
├── store/           # Global state management (Zustand stores)
├── utils/           # Pure functions, validators, and formatters
├── App.jsx          # Root component and layout provider
└── main.jsx         # Vite entry point
```

## 3. Key Design Decisions
*   **Vite:** Chosen over Create-React-App for significantly faster Hot Module Replacement (HMR) and optimized Rollup-based production builds.
*   **Zustand:** Selected for global state management due to its minimal boilerplate and superior performance compared to Redux or Context API for medium-scale apps.
*   **Axios:** Used as the HTTP client to provide interceptors for centralized JWT handling and standardized error parsing.
*   **Tailwind CSS:** Enables rapid UI development and ensures a consistent design system via utility-first styling.

## 4. Data Flow
1.  **Ingestion:** User uploads a file via the `ResumeUpload` component; the file is validated via `utils/fileValidator`.
2.  **Processing:** The file is sent via `services/api` to the backend. The UI transitions to a "Processing" state via the store.
3.  **Storage:** The API returns a parsed JSON payload; this is persisted in the global Zustand store for cross-component access.
4.  **Display:** Feature-specific components (`Dashboard`, `ScoreView`) observe the store and reactively render the analyzed results.

## 5. State Management Approach
The application utilizes a **"Feature-First" state strategy**:
*   **Global State:** Managed by Zustand for session data, user profiles, and analysis results to avoid prop-drilling.
*   **Local State:** Managed via standard `useState`/`useReducer` hooks for UI-specific interactions (e.g., dropdown toggles, form inputs).
*   **Server State:** Handled via `TanStack Query` (React Query) for caching, background refetching, and automatic loading/error state management.

## 6. Error Handling Strategy
*   **Global Boundary:** A top-level React `ErrorBoundary` component catches unexpected runtime exceptions to prevent full-app crashes.
*   **API Interceptors:** Axios interceptors catch 4xx/5xx status codes, triggering a notification service (e.g., `react-toastify`) to provide user-friendly feedback.
*   **Form Validation:** Schema-based validation (using Zod) is implemented at the feature level to prevent invalid data from being sent to the processing pipeline.