# Resume Keyword Scanner

An intelligent web application that analyzes resumes against job descriptions to provide keyword matching, gap analysis, and optimized scoring.

## Features

*   **PDF Parsing:** Extracts structured text from uploaded PDF resumes using high-performance parsing libraries.
*   **Keyword Extraction:** Automatically identifies core skills, technologies, and certifications from job descriptions.
*   **Match Scoring:** Calculates a weighted percentage match based on keyword frequency and relevance.
*   **Gap Analysis:** Identifies missing essential keywords that could improve the candidate's ranking in Applicant Tracking Systems (ATS).
*   **Secure Authentication:** Protects user data and analysis history using JWT-based authentication.
*   **Responsive UI:** A modern interface built with React and TypeScript for seamless desktop and mobile interaction.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| TypeScript | Type-safe development |
| Express | Backend REST API framework |
| PostgreSQL | Relational database for user data and analysis logs |
| Node.js | Server-side runtime environment |
| Prisma | Type-safe ORM for database interactions |

## Getting Started

### Prerequisites

*   Node.js (version 18.x or higher)
*   npm (version 9.x or higher)
*   PostgreSQL (version 14.x or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/resume-keyword-scanner.git
   cd resume-keyword-scanner
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   cd client && npm install && cd ../server && npm install
   ```

### Environment Setup

1. Navigate to the root directory and create the environment files:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and configure the following variables:
   *   `DATABASE_URL`: Your PostgreSQL connection string.
   *   `JWT_SECRET`: A secure random string for token signing.
   *   `PORT`: The port for the backend server (default: 5000).

### Running Locally

1. Start the database (if using Docker):
   ```bash
   docker-compose up -d
   ```

2. Start the development servers:
   ```bash
   # Run from the root directory
   npm run dev
   ```

## Available Scripts

*   `npm run dev`: Starts both client and server in development mode with hot-reloading.
*   `npm run build`: Compiles the project for production deployment.
*   `npm run test`: Runs the test suite using Jest.
*   `npm run lint`: Executes ESLint to enforce code quality and standards.

## Project Structure

*   `/client`: Contains the React frontend source code, components, and hooks.
*   `/server`: Contains the Express backend, API routes, and controllers.
*   `/server/controllers`: Logic for handling incoming requests and interacting with the database.
*   `/server/middleware`: Authentication guards and request validation layers.
*   `/server/routes`: Definition of API endpoints.
*   `/prisma`: Database schema definitions and migration history.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.