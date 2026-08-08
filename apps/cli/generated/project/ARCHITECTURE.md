# ARCHITECTURE.md: AegisKanban

## 1. System Overview
AegisKanban is a high-performance task management platform built with React, leveraging Prisma for type-safe data access. The system is architected for modularity and scalability, utilizing a unidirectional data flow to ensure consistent UI state across complex Kanban board operations.

## 2. Folder Structure
```text
/src
  /components     # Atomic design patterns (atoms, molecules, organisms)
  /hooks          # Custom business logic hooks (e.g., useBoard, useDrag)
  /services       # API clients and external service adapters
  /store          # Global state definitions (Zustand)
  /types          # TypeScript interface definitions
  /utils          # Pure utility functions and formatters
/prisma
  schema.prisma   # Source of truth for data models and relations
```

## 3. Key Design Decisions
*   **React:** Chosen for its component-based architecture and mature ecosystem, facilitating rapid development of dynamic UI elements like drag-and-drop boards.
*   **Prisma:** Selected as the ORM to provide end-to-end type safety, ensuring the frontend interfaces remain strictly synced with database schemas.
*   **Zustand:** Chosen over Redux for state management due to its minimal boilerplate, high performance, and simple API, which reduces cognitive load in the codebase.
*   **Atomic Design:** Implemented to enforce reusability and prevent "prop drilling" by encouraging the creation of small, isolated components.

## 4. Data Flow
1.  **Action:** User triggers an event (e.g., moving a task card).
2.  **Optimistic Update:** The UI state is updated immediately via the store to ensure 0ms latency perception.
3.  **Sync:** A service module dispatches an API request to the backend.
4.  **Storage:** Prisma translates the request into SQL, updating the PostgreSQL database.
5.  **Reconciliation:** Upon success, the UI reconciles with the server response; upon failure, the store rolls back the optimistic update and triggers an error notification.

## 5. State Management Approach
The application utilizes a **split-state strategy**:
*   **Global State (Zustand):** Used for shared domain data (boards, tasks, user session) that must persist across page reloads and cross-component boundaries.
*   **Local State (useState/useReducer):** Used for ephemeral UI logic such as form inputs, dropdown toggles, and animation states to keep the global store lean.

## 6. Error Handling Strategy
*   **Boundary Layers:** React Error Boundaries wrap major functional zones (Board, Sidebar) to prevent total application crashes from localized component failures.
*   **API Interceptors:** All service calls are wrapped in a global axios/fetch interceptor to catch 4xx/5xx status codes.
*   **User Feedback:** Standardized `Toast` notification system to provide immediate context-aware feedback for all failed persistence operations.