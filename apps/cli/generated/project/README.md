# ArtGalleryPortal

A full-stack web application designed for managing and discovering digital art collections with seamless performance and a modern user interface.

## Features

*   **Advanced Filtering:** Sort and filter artwork by category, artist, and medium.
*   **Search Functionality:** Real-time search implementation to quickly locate specific pieces.
*   **Dark Mode Support:** Fully responsive design with togglable light and dark themes using system preference detection.
*   **Persistent Data:** Robust database management using Prisma with SQLite for reliable local storage.
*   **Type-Safe Architecture:** Full TypeScript integration from backend API routes to frontend components.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| Express | Backend API server |
| Prisma | ORM for database management |
| SQLite | Relational database engine |
| TypeScript | Type safety across the stack |
| Tailwind CSS | Styling and theme management |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/art-gallery-portal.git
   cd art-gallery-portal
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
2. Open the `.env` file and configure your `DATABASE_URL` and any required API keys.

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start the development server for both the frontend and backend:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Compiles the project for production deployment.
*   `npm run test`: Executes the test suite using Vitest.
*   `npm run lint`: Runs ESLint to check for code quality and style issues.
*   `npm run prisma:generate`: Generates the Prisma client based on the schema.

## Project Structure

*   `/prisma`: Contains the `schema.prisma` file and migration history.
*   `/src/api`: Express backend routes and controller logic.
*   `/src/components`: Reusable React components (buttons, filters, cards).
*   `/src/hooks`: Custom React hooks for state management and data fetching.
*   `/src/types`: Global TypeScript interface definitions.
*   `/public`: Static assets, including images and fonts.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.