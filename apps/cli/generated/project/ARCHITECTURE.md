# Architecture: resume-keyword-scanner

## 1. System Overview
The `resume-keyword-scanner` is a React-based SPA designed to parse uploaded resumes, extract meaningful entities, and match them against job description requirements. The system prioritizes local processing for privacy and performance, utilizing client-side extraction logic before optionally syncing results to a persistent store.

## 2. Folder Structure
```text
src/
├── assets/          # Static files (icons, fonts)
├── components/      # Atomic UI components (Button, Input, FileUploader)
├── hooks/           # Custom React hooks (useScanner, useParser)
├── services/        # External API wrappers & logic (PDF-parser, OCR)
├── store/           # Global state definitions (Zustand)
├── utils/           # Helper functions (text-normalization, regex)
└── types/           # TypeScript interface definitions
```

## 3. Key Design Decisions
*   **React (Vite):** Selected for rapid HMR and lightweight production builds suitable for browser-based utility tools.
*   **Zustand:** Chosen for state management over Redux due to minimal boilerplate and high performance for transient state (like parsed keyword lists).
*   **Web Workers:** Offloads CPU-intensive PDF parsing/text extraction to background threads to prevent UI blocking during file processing.
*   **Tailwind CSS:** Utilized for utility-first styling to maintain a consistent design system with low bundle size overhead.

## 4. Data Flow
1.  **Input:** User uploads a file via `FileUploader`.
2.  **Processing:** The `useScanner` hook triggers a Web Worker to convert the blob into raw text.
3.  **Extraction:** Text is passed through `ParserService` which applies regex/NLP rules to extract keywords.
4.  **State Update:** The resulting keyword array is committed to the Zustand store.
5.  **Output:** Components react to store changes to render the analysis dashboard.

## 5. State Management Approach
The application employs **Zustand** as a central store. 
*   **UI State:** Stored locally within specific components using `useState` (e.g., toggle states, dropdown values).
*   **Application State:** Global data (parsed keywords, resume metadata, scan history) resides in the Zustand store to facilitate cross-component access without prop-drilling.

## 6. Error Handling Strategy
*   **Boundary Layers:** React `ErrorBoundary` components wrap the main dashboard to prevent white-screen crashes on parsing failures.
*   **Input Validation:** The `FileUploader` enforces strict MIME-type checks and file size limits before processing begins.
*   **Graceful Degradation:** Parsing errors are caught via `try/catch` within service hooks, dispatching an error payload to the store to display user-friendly toast notifications rather than failing silently.