# Aegis-Expense-Tracker

A high-performance, full-stack expense tracking and budgeting application featuring an intuitive glassmorphism UI designed for personal financial management.

## Features

*   **Financial Logging:** Create, edit, and delete income and expense entries with customizable categorization.
*   **Budget Management:** Real-time monthly budget progress tracking with visual indicators.
*   **Data Visualization:** Interactive pie charts providing category-based breakdowns of spending habits.
*   **Advanced Filtering:** Filter transactions dynamically by date range and specific expense categories.
*   **Export Functionality:** Generate and download financial reports in CSV and PDF formats.
*   **Glassmorphism UI:** A modern, visually immersive design system supporting full dark mode.
*   **Robust Backend:** Type-safe API layer built with Express, Prisma ORM, and SQLite.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React 18 | Frontend UI library |
| Vite | Build tool and development server |
| TypeScript | Type-safe application logic |
| Express.js | Backend RESTful API server |
| Prisma | ORM for SQLite database management |
| SQLite | Lightweight, file-based relational database |
| Tailwind CSS | Utility-first styling for glassmorphism |
| Recharts | Interactive financial data visualization |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aegis-expense-tracker.git
   cd aegis-expense-tracker
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

3. Run Prisma migrations to initialize the database:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start both the backend server and the Vite development server concurrently:

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development environment for frontend and backend.
*   `npm run build`: Compiles the React frontend and prepares the backend for production.
*   `npm run lint`: Executes ESLint to check for code quality and style violations.
*   `npm run test`: Runs the integrated test suite using Vitest.

## Project Structure

*   `/src/client`: React frontend components, hooks, and state management.
*   `/src/server`: Express application routes, middleware, and controllers.
*   `/prisma`: Database schema definitions and migration files.
*   `/public`: Static assets, including images and fonts.
*   `/types`: Global TypeScript interface and type definitions.
*   `/dist`: Output directory for production-ready builds.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.