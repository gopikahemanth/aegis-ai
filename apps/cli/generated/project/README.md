# Aegis Expense Tracker

Aegis Expense Tracker is a high-performance, full-stack SaaS application designed for streamlined personal finance management, featuring real-time expense logging, visual budget analytics, and a modern glassmorphism user interface.

## Key Features

*   **Smart Logging:** Interactive income and expense tracking with dynamic category tagging.
*   **Budget Intelligence:** Real-time monthly budget progress tracking via visual progress bars.
*   **Financial Analytics:** Interactive pie charts providing instant visual breakdowns of spending habits.
*   **Data Portability:** Seamless export capabilities for transaction data in CSV and PDF formats.
*   **Advanced Filtering:** Granular transaction management with filtering by custom date ranges and expense categories.
*   **CRUD Operations:** Intuitive modal-based interface for effortless editing and deletion of records.
*   **Modern UI/UX:** Responsive glassmorphism-inspired design with built-in dark mode support.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React 18 | Frontend UI library |
| Vite | Build tool and development environment |
| Express.js | Backend API server |
| Prisma | Type-safe ORM for database operations |
| SQLite | Lightweight, file-based relational database |
| TypeScript | Type safety and enhanced developer experience |
| Tailwind CSS | Styling and glassmorphism UI components |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn (v1.22.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/aegis-expense-tracker.git
   cd aegis-expense-tracker
   ```

2. Install dependencies for both server and client:
   ```bash
   npm install
   cd client && npm install && cd ../server && npm install
   ```

### Environment Setup

1. Copy the example environment file in the `server` directory:
   ```bash
   cp server/.env.example server/.env
   ```
2. Open `server/.env` and configure your database connection string and any necessary API keys.

### Running Locally

To start the development environment, run the following command from the root directory:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (Frontend) and the API will be running on `http://localhost:3000` (Backend).

## Available Scripts

*   `npm run dev`: Starts both the client and server in development mode.
*   `npm run build`: Compiles the project for production deployment.
*   `npm run lint`: Executes ESLint to verify code quality and consistency.
*   `npm run test`: Runs the integrated test suite.

## Project Structure

*   `/client`: Contains the React/Vite frontend source code, components, and hooks.
*   `/server`: Contains the Express API logic, Prisma schema, and database configuration.
*   `/prisma`: Holds the database schema definitions and migration history.
*   `/public`: Static assets, including icons and global images.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.