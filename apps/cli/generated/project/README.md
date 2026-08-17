# ATS-Resume-Analyzer

An intelligent AI-powered platform designed to parse resumes, extract key qualifications, and provide automated ATS (Applicant Tracking System) compatibility scoring against specific job descriptions.

## Features

*   **Drag-and-Drop Resume Upload**: Seamless file ingestion supporting PDF formats with real-time preview.
*   **AI-Powered Keyword Extraction**: Utilizes Natural Language Processing to identify hard skills, soft skills, and industry-specific terminology.
*   **ATS Match Scoring**: Calculates a percentage-based compatibility score comparing resume content against job requirement parameters.
*   **Gap Analysis**: Provides actionable feedback on missing keywords or underrepresented experience areas.
*   **Candidate Reporting**: Generates structured summaries for recruiters to streamline the screening process.
*   **Secure Data Persistence**: Robust candidate and job metadata storage managed via PostgreSQL.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React (Vite)** | Frontend framework for building the user interface |
| **TypeScript** | Static typing for improved code reliability and maintainability |
| **Express.js** | Backend REST API server |
| **PostgreSQL** | Relational database for storing user, resume, and job data |
| **Prisma** | ORM for database schema management and type-safe queries |
| **Tailwind CSS** | Utility-first CSS framework for responsive design |

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   PostgreSQL instance running locally or via a cloud provider

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ats-resume-analyzer.git
   cd ats-resume-analyzer
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

2. Open the `.env` file and configure the following variables:
   - `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., `postgresql://user:password@localhost:5432/ats_db`)
   - `PORT`: Server port (default: 3000)
   - `OPENAI_API_KEY`: API key for AI-driven parsing services

### Running Locally

To start the development server:
```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server with hot-module replacement.
*   `npm run build`: Compiles the TypeScript code and bundles the application for production.
*   `npm run lint`: Runs ESLint to check for code quality and style violations.
*   `npm run test`: Executes the Jest test suite for unit and integration testing.

## Project Structure

*   `/client`: Contains the React/Vite frontend application source code.
*   `/server`: Contains the Express.js API logic, controllers, and middleware.
*   `/prisma`: Defines the database schema and migration history.
*   `/types`: Shared TypeScript interface definitions for frontend/backend consistency.
*   `/public`: Static assets including fonts and images.

## License

This project is licensed under the [MIT License](LICENSE).