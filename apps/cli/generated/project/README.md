# Aegis-Expense-Tracker

A high-performance, full-stack personal finance management application designed for streamlined expense tracking, category-based budgeting, and data-driven spending analytics.

## Features

*   **Transaction Management:** Create, read, update, and delete expenses with support for custom categories and transaction notes.
*   **Budgeting System:** Define and track monthly spending limits per category with real-time progress visualization.
*   **Spending Analytics:** Interactive charts providing monthly breakdowns and visual summaries of financial habits.
*   **Responsive UI:** A clean, mobile-friendly interface supporting both Light and Dark mode themes.
*   **Type-Safe Architecture:** Full-stack TypeScript implementation ensuring end-to-end data integrity.
*   **Persistent Storage:** Reliable local data management powered by SQLite and Prisma ORM.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React** | Frontend UI library |
| **Express** | Backend API server |
| **Prisma** | ORM for database schema and query management |
| **SQLite** | Lightweight, file-based relational database |
| **TypeScript** | Static typing for both client and server |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Recharts** | Composable charting library for analytics |

## Getting Started

### Prerequisites

*   **Node.js:** v18.0.0 or higher
*   **npm:** v9.0.0 or higher (or equivalent yarn/pnpm version)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aegis-expense-tracker.git
   cd aegis-expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

1. Copy the example environment file to create your local configuration:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and configure your settings (e.g., `DATABASE_URL` and `PORT`).

3. Run the database migration to initialize the SQLite database:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start both the backend and frontend development servers concurrently:
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading for both client and server.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Executes ESLint to verify code quality and consistency.
*   `npm run test`: Runs the test suite using the configured testing framework.

## Project Structure

```text
aegis-expense-tracker/
├── prisma/            # Database schema and migration files
├── src/
│   ├── api/           # Express server routes and controllers
│   ├── components/    # Reusable React UI components
│   ├── hooks/         # Custom React hooks for data fetching/logic
│   ├── store/         # State management configuration
│   └── utils/         # Shared helper functions and types
├── public/            # Static assets
└── package.json       # Project dependencies and script definitions
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.