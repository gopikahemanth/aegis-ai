# ARCHITECTURE.md: resume-oracle-ai

## 1. System Overview
Resume-oracle-ai is a React-based SPA designed to parse, analyze, and optimize user resumes using LLM-driven insights. The system provides a reactive interface for document ingestion, real-time feedback loops, and structured data visualization to improve candidate competitiveness.

## 2. Folder Structure
```text
/src
├── assets/          # Static assets (images, global CSS)
├── components/      # Atomic UI components (Buttons, Inputs, Cards)
├── hooks/           # Custom React hooks for business logic
├── services/        # API clients and LLM integration modules
├── store/           # Global state management slices
├── types/           # TypeScript interfaces and shared schemas
├── utils/           # Pure helper functions and validators
└── views/           # Page-level components (Dashboard, Upload, Analysis)
```

## 3. Key Design Decisions
*   **React (Vite):** Selected for high development velocity, robust ecosystem, and efficient DOM updates via Virtual DOM.
*   **TypeScript:** Enforced for type safety across complex data shapes (resume objects) to reduce runtime errors during parsing.
*   **Tailwind CSS:** Used for utility-first styling to ensure a consistent design system and optimized bundle size.
*   **Axios:** Chosen as the HTTP client for its interceptor support, enabling centralized handling of auth tokens and error formatting.

## 4. Data Flow
1.  **Ingestion:** User uploads a resume via `UploadView`, which triggers an `UploadService` call to the backend.
2.  **Processing:** The backend streams the document through an extraction pipeline; the UI polls or listens via WebSockets for the parsed JSON payload.
3.  **Synchronization:** Upon receipt, the parsed data is dispatched to the `AppStore`, updating the reactive state.
4.  **Feedback:** User interactions (e.g., "optimize section") trigger `Service` calls that send partial updates to the LLM, returning a delta that merges with the current state.

## 5. State Management Approach
The application utilizes a **Redux Toolkit (RTK)** slice-based architecture. 
*   **Global State:** Resume data, user profile, and session status are stored in the Redux store to ensure consistency across views.
*   **Local State:** Component-specific UI states (e.g., form input, dropdown toggles) are managed via `useState` or `useReducer` to minimize store overhead.

## 6. Error Handling Strategy
*   **Centralized Interceptors:** Axios interceptors globally catch 4xx/5xx status codes to trigger toast notifications.
*   **ErrorBoundary:** Top-level React Error Boundaries prevent application-wide crashes, providing a fallback UI for component failures.
*   **Form Validation:** Schema validation (via Zod) ensures that parsed data adheres to strict structural requirements before being injected into the state store.