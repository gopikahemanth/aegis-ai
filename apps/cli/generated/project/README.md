# AegisKanban

AegisKanban is a high-performance, full-stack project management application designed for streamlined task tracking and collaborative team workflows.

## Features

*   **Interactive Kanban Board:** Intuitive drag-and-drop interface for seamless task transition between "To Do," "In Progress," and "Done" states.
*   **Dynamic Task Management:** Create, edit, and delete tasks with custom priority levels (Low, Medium, High).
*   **Team Collaboration:** Modal-based assignment system to delegate tasks to specific team members.
*   **Advanced Filtering:** Real-time filtering capabilities to isolate tasks by project status or priority.
*   **Dark Mode UI:** Optimized interface with native dark mode support for improved accessibility and reduced eye strain.
*   **Type-Safe Architecture:** Full TypeScript implementation from frontend to database for robust, bug-resistant code.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI Library |
| TypeScript | Type-safe programming |
| PostgreSQL | Relational Database |
| Prisma | ORM and Database Schema Management |
| Tailwind CSS | Utility-first styling |
| Node.js | Runtime Environment |

## Getting Started

### Prerequisites

*   **Node.js:** v18.0.0 or higher
*   **npm/yarn/pnpm:** Current stable release
*   **PostgreSQL:** A running instance (local or remote)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aegis-kanban.git
   cd aegis-kanban
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and provide your database connection string:
   ```text
   DATABASE_URL="postgresql://user:password@localhost:5432/aegis_db"
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Runs ESLint to identify code quality issues.
*   `npm run test`: Executes the test suite using the configured test runner.

## Project Structure

*   `/prisma`: Contains the schema definitions and migration history.
*   `/src/components`: Reusable React components (modals, task cards, UI elements).
*   `/src/hooks`: Custom React hooks for state management and data fetching.
*   `/src/lib`: Utility functions and database client configuration.
*   `/src/types`: TypeScript interface and type definitions.
*   `/public`: Static assets, including icons and global images.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.