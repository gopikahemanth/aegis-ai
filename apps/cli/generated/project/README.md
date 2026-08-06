# AegisArtGallery

A robust full-stack web application for managing and browsing digital art collections with real-time filtering and responsive design.

## Features

*   **Dynamic Art Gallery:** Browse collections with a masonry-style grid layout.
*   **Advanced Search & Filtering:** Real-time filtering by artist, genre, and creation date.
*   **State Persistence:** Dark mode integration with system preference detection.
*   **RESTful API:** Efficient data retrieval using Express.js and Prisma ORM.
*   **Type Safety:** End-to-end TypeScript integration for reliable data handling.
*   **Relational Database:** SQLite-backed storage for optimized local development.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI Library |
| TypeScript | Type-safe programming language |
| Express | Backend API Framework |
| Prisma | ORM for database management |
| SQLite | Relational database engine |
| Vite | Frontend build tool and dev server |
| Tailwind CSS | Utility-first styling framework |

## Getting Started

### Prerequisites

*   **Node.js**: Version 18.x or higher
*   **npm**: Version 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/aegis-art-gallery.git
   cd aegis-art-gallery
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

2. Open the `.env` file and configure the following variables:
   *   `DATABASE_URL`: The file path for the SQLite database (e.g., `file:./dev.db`).
   *   `PORT`: The port for the backend server (default: `3000`).

3. Initialize the database schema:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start both the frontend and backend development servers, run:

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development environment with hot reloading.
*   `npm run build`: Compiles the application for production.
*   `npm run lint`: Runs ESLint to check for code quality and style issues.
*   `npm run prisma:generate`: Generates the Prisma client based on the current schema.
*   `npm run test`: Executes the test suite using Vitest.

## Project Structure

*   `/prisma`: Contains the database schema (`schema.prisma`) and migration history.
*   `/src/client`: Frontend React components, hooks, and styles.
*   `/src/server`: Express API routes, controllers, and middleware.
*   `/src/shared`: TypeScript interfaces shared between the client and server.
*   `/public`: Static assets, images, and global manifests.

## License

This project is licensed under the [MIT License](LICENSE).