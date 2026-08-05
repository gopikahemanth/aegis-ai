# AegisArtGallery

A robust full-stack web application for managing and browsing digital art collections with advanced filtering and search capabilities.

## Features

*   **Gallery Management:** View high-resolution artworks with detailed metadata.
*   **Search & Filtering:** Real-time search functionality with filtering by artist, category, and year.
*   **Dark Mode:** Built-in theme toggling for enhanced accessibility and user comfort.
*   **Responsive Design:** Fully fluid UI layout optimized for desktop, tablet, and mobile devices.
*   **Type-Safe Architecture:** End-to-end type safety using TypeScript and Prisma.
*   **Efficient Data Layer:** Optimized SQLite database queries for fast retrieval and filtering.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React** | Frontend user interface library |
| **Express** | Node.js backend framework |
| **Prisma** | ORM for database management and type-safe queries |
| **SQLite** | Lightweight, file-based database engine |
| **TypeScript** | Static typing for both client and server |
| **Tailwind CSS** | Utility-first styling for responsive layouts |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn

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

2. Open the `.env` file and configure your database connection string and application port.

### Running Locally

1. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Runs ESLint to check for code quality and style violations.
*   `npm run test`: Executes the test suite using Vitest.
*   `npm run prisma:generate`: Regenerates the Prisma client after schema updates.

## Project Structure

*   `/src/client`: React components, hooks, and application state logic.
*   `/src/server`: Express API routes, middleware, and controllers.
*   `/prisma`: Contains the schema file and database migration history.
*   `/public`: Static assets including images and fonts.
*   `/dist`: Compiled production files generated during the build process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.