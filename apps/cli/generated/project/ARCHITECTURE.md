# Architecture.md: ArtGalleryPortal

## 1. System Overview
ArtGalleryPortal is a high-performance React-based web application designed to facilitate the curation, display, and management of digital art collections. The system emphasizes a component-driven architecture to ensure modularity, scalability, and an optimized user experience for art enthusiasts and gallery administrators.

## 2. Folder Structure
```text
src/
├── assets/          # Static assets (images, fonts, global styles)
├── components/      # Atomic UI components (buttons, cards, inputs)
├── context/         # React Context providers for global state
├── hooks/           # Custom reusable React hooks (data fetching, logic)
├── pages/           # Route-level components mapping to URL paths
├── services/        # API integration layers and external utilities
├── utils/           # Helper functions and constants
└── App.jsx          # Root component and router configuration
```

## 3. Key Design Decisions
*   **React (Vite):** Selected for rapid development, HMR support, and a highly efficient build pipeline.
*   **Functional Components & Hooks:** Mandated to ensure clean logic separation and code reusability.
*   **Context API:** Utilized for lightweight global state (e.g., authentication, theme) to avoid the overhead of heavy external libraries like Redux.
*   **Axios:** Standardized for HTTP requests to provide robust interceptors for auth tokens and centralized error handling.

## 4. Data Flow
1.  **User Action:** An interaction triggers a UI event within a page or component.
2.  **Request Layer:** The component invokes a method from `services/`, which utilizes Axios to communicate with the RESTful backend.
3.  **State Update:** Upon a successful response, the data is pushed into the React State or Context provider.
4.  **Re-render:** React detects the state change and triggers a declarative UI update to display the new data.

## 5. State Management Approach
The application employs a hybrid strategy:
*   **Local State (`useState`):** Used for ephemeral component-specific data (e.g., toggle states, form inputs).
*   **Global State (Context API):** Used for shared domain data that must persist across the application lifecycle, such as user session data and global art collection filters.

## 6. Error Handling Strategy
*   **API Layer:** Centralized interceptors in `services/api.js` catch non-2xx status codes, logging errors to a monitoring service and throwing user-friendly messages.
*   **UI Layer:** React Error Boundaries are implemented at the route level to prevent entire application crashes in the event of component-level runtime errors.
*   **User Feedback:** The UI utilizes a centralized "Toast" notification system to surface error messages to the user without interrupting the visual flow.