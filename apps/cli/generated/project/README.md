# Expense Tracker Pro

A comprehensive full-stack personal finance application designed to track expenses, manage category budgets, and visualize monthly spending habits.

## Features

*   **Transaction Management:** Create, read, update, and delete expenses with customizable categories and dates.
*   **Budgeting System:** Set monthly spending caps per category with real-time progress monitoring.
*   **Analytics Dashboard:** Visualize spending trends using interactive charts based on monthly data.
*   **Theming:** Seamless toggling between light and dark modes for optimal user experience.
*   **Data Integrity:** Reliable persistence using Prisma ORM with an SQLite backend.
*   **Type Safety:** End-to-end TypeScript integration ensuring consistent data structures.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI framework |
| Express | Backend API server |
| Prisma | ORM for database management |
| SQLite | Relational database engine |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and theme management |
| Recharts | Data visualization and analytics |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/expense-tracker-pro.git
   cd expense-tracker-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

1. Copy the environment template file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and configure your database URL and server port.

3. Run database migrations to initialize the SQLite schema:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start the development environment (concurrently running client and server):

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Compiles the project for production deployment.
*   `npm run test`: Executes the unit and integration test suites.
*   `npm run lint`: Runs the linter to ensure code quality and consistency.

## Project Structure

*   `/client`: Contains the React frontend application source code.
*   `/server`: Contains the Express backend API and route definitions.
*   `/prisma`: Holds the schema.prisma file and migration history.
*   `/shared`: Contains shared TypeScript interfaces and validation logic.
*   `/.env`: Local environment variables (not tracked in version control).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.