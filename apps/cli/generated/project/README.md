# AegisExpenseTracker

A comprehensive full-stack personal finance management application designed to track expenses, manage category budgets, and visualize spending habits.

## Features

*   **Transaction Management:** Create, read, update, and delete expenses with automated timestamping.
*   **Budgeting:** Set and monitor monthly spending limits per category.
*   **Analytics Dashboard:** Visualize spending trends and category distribution using interactive charts.
*   **Data Persistence:** Robust SQLite storage managed via Prisma ORM.
*   **Theming:** Seamless toggling between light and dark modes for user preference.
*   **Type Safety:** End-to-end TypeScript integration for maintainable and reliable code.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| TypeScript | Type safety for frontend and backend |
| Express.js | Backend REST API server |
| Prisma | Database ORM and schema management |
| SQLite | Lightweight relational database |
| Tailwind CSS | Utility-first styling and theming |
| Recharts | Data visualization and analytics |

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm (v9.x or higher) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AegisExpenseTracker.git
   cd AegisExpenseTracker
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

2. Open the `.env` file and configure your database connection string and API ports as required.

### Running Locally

To start the development environment (concurrently running the frontend and backend):

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server for both React and Express.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Executes ESLint to check for code quality and style violations.
*   `npm run test`: Runs the test suite to ensure functional integrity.
*   `prisma:generate`: Generates the Prisma client based on the current schema.

## Project Structure

*   `/client`: Contains the React frontend application, components, and UI logic.
*   `/server`: Contains the Express API routes, controllers, and middleware.
*   `/prisma`: Holds the `schema.prisma` file and migration history.
*   `/shared`: Houses shared TypeScript interfaces and constants used by both frontend and backend.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.