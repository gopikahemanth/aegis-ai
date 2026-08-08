# AegisExpenseTrack

AegisExpenseTrack is a robust, full-stack SaaS solution designed for streamlined personal finance management, featuring real-time expense tracking, automated budget visualization, and intuitive data reporting.

## Key Features

*   **Interactive Financial Logging:** Seamlessly log income and expenses with dynamic category tagging.
*   **Budget Oversight:** Real-time monthly budget progress bars with visual threshold alerts.
*   **Data Visualization:** Interactive pie charts providing instant breakdowns of spending by category.
*   **Advanced Data Management:** Filter transactions by custom date ranges and specific categories.
*   **Export Capabilities:** Generate and download financial reports in CSV and PDF formats.
*   **CRUD Functionality:** Integrated modal-based interface for effortless transaction editing and deletion.
*   **Modern UI/UX:** A responsive, dark-mode glassmorphism interface built for high readability and visual comfort.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React 18 (Vite) | Frontend framework and build tool |
| TypeScript | Type-safe application logic |
| Express.js | Backend API architecture |
| Prisma | Type-safe ORM for database operations |
| SQLite | Lightweight relational database management |
| Tailwind CSS | Styling and glassmorphism UI implementation |

## Getting Started

### Prerequisites

*   **Node.js:** v18.0.0 or higher
*   **Package Manager:** npm (v9+) or yarn (v1.22+)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aegis-expense-track.git
   cd aegis-expense-track
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
   *Open the `.env` file and configure the `DATABASE_URL` and `PORT` variables as required.*

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start both the client and server concurrently in development mode:
```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server with hot-module replacement.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run lint`: Executes ESLint to verify code quality and consistency.
*   `npm run test`: Runs the configured test suite for core logic validation.

## Project Structure

*   `/client`: Contains the React/Vite frontend source code, including components, hooks, and styles.
*   `/server`: Houses the Express API, routes, and middleware.
*   `/prisma`: Contains the schema definition and database migration files.
*   `/public`: Static assets, icons, and fonts used throughout the application.
*   `/types`: Global TypeScript interface definitions for cross-module consistency.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.