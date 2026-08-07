# AegisFitnessTracker

A comprehensive full-stack workout and fitness management application designed to track progress, visualize training volume, and maintain consistency through streak monitoring.

## Features

*   **Workout Logging:** Intuitive interface to record sets, repetitions, and weight lifted per exercise.
*   **Exercise Categorization:** Visual badges for muscle groups to allow for quick identification and filtering.
*   **Analytics Dashboard:** Interactive charts calculating weekly training volume and progress trends.
*   **Consistency Tracking:** Integrated streak counter to motivate long-term adherence.
*   **CRUD Operations:** Full lifecycle management of workouts with dedicated edit and delete modals.
*   **Filtering:** Filter workout history by specific muscle groups or date ranges.
*   **UI/UX:** Modern dark-mode glassmorphism design for a sleek, ergonomic user experience.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React** | Frontend UI library and component state management |
| **TypeScript** | Type-safe development across frontend and backend |
| **Express** | RESTful API server framework |
| **Prisma** | ORM for database schema modeling and queries |
| **SQLite** | Lightweight, file-based relational database |
| **Recharts** | Data visualization for workout analytics |
| **Tailwind CSS** | Styling and glassmorphism UI implementation |

## Getting Started

### Prerequisites
* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher) or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aegis-fitness-tracker.git
   cd aegis-fitness-tracker
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   ```

### Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and configure your database connection string and API keys as required by the application.

### Running Locally
To start both the backend server and the frontend development environment:
```bash
npm run dev
```

## Available Scripts

* `npm run dev`: Starts the development server with hot-reloading for both client and server.
* `npm run build`: Compiles the application for production deployment.
* `npm run lint`: Executes ESLint to verify code quality and style adherence.
* `npm run test`: Runs the test suite using the configured testing framework.
* `npm run prisma:generate`: Updates the Prisma client based on schema changes.

## Project Structure

* `/src/client`: React source code, including components, hooks, and context providers.
* `/src/server`: Express API routes, middleware, and controller logic.
* `/prisma`: Database schema definition (`schema.prisma`) and migration history.
* `/public`: Static assets and global configuration files.
* `/types`: Shared TypeScript interface definitions for frontend and backend synchronization.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.