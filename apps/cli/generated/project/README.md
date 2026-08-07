# Aegis-Expense-Tracker

A comprehensive full-stack personal finance management application designed to track spending habits, manage category budgets, and visualize monthly financial analytics.

## Features

*   **Transaction Management:** Create, read, update, and delete expenses with custom labels, dates, and amounts.
*   **Budgeting:** Set and monitor monthly spending limits per category to maintain financial health.
*   **Analytics Dashboard:** Visualize spending trends and category distribution through interactive charts.
*   **Theme Support:** Seamless toggle between light and dark modes for optimal viewing in any environment.
*   **Type-Safe Architecture:** Full TypeScript integration from the database schema to the frontend components.
*   **Persistent Storage:** Reliable data management using SQLite via Prisma ORM.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| Express | Backend API server |
| Prisma | ORM for database management |
| SQLite | Relational database storage |
| TypeScript | Type safety across the stack |
| Tailwind CSS | Styling and theme management |
| Recharts | Data visualization and analytics |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aegis-expense-tracker.git
   cd aegis-expense-tracker
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
2. Open the `.env` file and configure the `DATABASE_URL` and `PORT` variables as required by your local setup.

### Running Locally

1. Run the database migration to initialize the schema:
   ```bash
   npx prisma migrate dev
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## Available Scripts

*   `npm run dev`: Starts the development server for both frontend and backend.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Runs ESLint to identify and fix code quality issues.
*   `npm run test`: Executes the test suite via Jest.
*   `npx prisma studio`: Opens the visual database management tool for SQLite.

## Project Structure

*   `/prisma`: Contains the schema.prisma file and migration history.
*   `/src/server`: Express.js backend logic, API routes, and controllers.
*   `/src/client`: React frontend source code, including components, hooks, and pages.
*   `/src/types`: Shared TypeScript interfaces and utility types.
*   `/public`: Static assets, icons, and index.html.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.