# SentinelCode

SentinelCode is an AI-powered code review and security vulnerability scanning platform designed to provide automated, real-time feedback on source code quality and security posture.

## Features

*   **Automated Security Scanning:** Detects OWASP Top 10 vulnerabilities, including SQL injection, XSS, and hardcoded credentials.
*   **Static Analysis Engine:** Deep AST-based inspection to identify code smells, anti-patterns, and maintainability issues.
*   **Risk Scoring:** Calculates a severity score (Low to Critical) for each identified vulnerability based on impact and exploitability.
*   **Interactive Code Breakdowns:** Provides line-by-line visual explanations and remediation suggestions for detected issues.
*   **Real-time Dashboard:** Centralized view for monitoring project health, scan history, and active alert trends.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| Vite | Build tool and development server |
| TypeScript | Type-safe development |
| Express | Backend API server |
| PostgreSQL | Relational database for scan results and user data |
| ESLint | Static analysis and code linting |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher) or yarn (v1.22.0 or higher)
*   PostgreSQL (v14 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/sentinel-code.git
   cd sentinel-code
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

2. Open the `.env` file and configure the following variables:
   *   `DATABASE_URL`: Your PostgreSQL connection string.
   *   `PORT`: The port for the backend server (default: 3000).
   *   `JWT_SECRET`: A secure key for user authentication.

### Running Locally

To start the development environment:
```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the application in development mode with hot module replacement.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run test`: Executes the test suite using Vitest.
*   `npm run lint`: Runs ESLint to check for code quality and style violations.

## Project Structure

*   `/src/components`: Reusable UI components and shared primitives.
*   `/src/features`: Domain-specific modules (e.g., `/dashboard`, `/scanner`, `/auth`).
*   `/src/hooks`: Custom React hooks for global state and API interaction.
*   `/src/services`: API client definitions and external service integrations.
*   `/src/types`: Global TypeScript interface and type definitions.
*   `/server`: Backend Express logic, database models, and security scanning engine.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.