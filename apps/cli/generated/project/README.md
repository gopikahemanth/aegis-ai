# Art Gallery Platform

A full-stack web application designed for managing and discovering fine art collections with real-time filtering, search capabilities, and a responsive UI.

## Features

*   **Art Catalog Management:** Full CRUD operations for artists, artworks, and collections.
*   **Dynamic Search:** Real-time keyword filtering to find specific artworks by title or artist.
*   **Advanced Filtering:** Sort and filter artworks by category, medium, and year of creation.
*   **Dark Mode Support:** Persistent theme toggling using Tailwind CSS and React state management.
*   **Type-Safe API:** Backend infrastructure built with Express and Prisma for robust database interactions.
*   **Responsive Design:** Mobile-first layout optimized for tablet and desktop viewing.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI framework |
| TypeScript | Type safety across frontend and backend |
| Express | Node.js web server framework |
| Prisma | ORM for database schema management |
| SQLite | Lightweight relational database |
| Tailwind CSS | Utility-first styling for UI and dark mode |
| Vite | Frontend build tool and development server |

## Getting Started

### Prerequisites

*   **Node.js:** v18.0.0 or higher
*   **npm:** v9.0.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/art-gallery-platform.git
   cd art-gallery-platform
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

2. Open the newly created `.env` file and configure your database connection string and any required API secret keys.

3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Running Locally

To start the development server for both the frontend and backend:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Available Scripts

*   `npm run dev`: Starts the development server with hot module replacement.
*   `npm run build`: Compiles the project for production deployment.
*   `npm run lint`: Runs ESLint to identify and fix code quality issues.
*   `npm run test`: Executes the test suite via Vitest.
*   `npm run prisma:generate`: Generates Prisma client types based on the schema.

## Project Structure

*   `/src/client`: Frontend React components, hooks, and pages.
*   `/src/server`: Express API routes, controllers, and middleware.
*   `/prisma`: Database schema definition and migration files.
*   `/public`: Static assets including icons and images.
*   `/types`: Shared TypeScript interfaces for data models.

## License

This project is licensed under the [MIT License](LICENSE).