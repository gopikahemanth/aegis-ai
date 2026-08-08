# Aegis Resume Optimizer

Aegis Resume Optimizer is a full-stack AI-powered tool designed to parse resumes, extract key qualifications, and provide actionable match scores against specific job descriptions.

## Features

*   **Intelligent PDF Parsing:** Uses advanced extraction libraries to convert PDF resumes into structured machine-readable text.
*   **Semantic Keyword Matching:** Employs NLP algorithms to calculate the relevance of applicant skills against target job descriptions.
*   **Gap Analysis:** Generates a detailed breakdown of missing keywords and skill deficiencies to optimize resume performance.
*   **Secure Data Persistence:** Utilizes PostgreSQL to store user profiles and history, ensuring resume data is retrievable for iterative improvements.
*   **Responsive UI:** Built with React and TypeScript for a type-safe, fluid user experience.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React** | Frontend UI library |
| **TypeScript** | Type-safe language architecture |
| **Express** | Node.js backend framework |
| **PostgreSQL** | Relational database for persistence |
| **Prisma** | ORM for database communication |
| **PDF-Parse** | PDF text extraction utility |

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm (v9.x or higher)
*   PostgreSQL (v14.x or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/aegis-resume-optimizer.git
   cd aegis-resume-optimizer
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
   *   `DATABASE_URL`: Connection string for your PostgreSQL instance.
   *   `PORT`: API server port (default 5000).
   *   `JWT_SECRET`: Secret key for authentication tokens.

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To start the development environment:

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading for both client and server.
*   `npm run build`: Compiles the TypeScript code into production-ready JavaScript.
*   `npm run test`: Executes the Jest test suite for unit and integration testing.
*   `npm run lint`: Runs ESLint to identify and fix code quality issues.

## Project Structure

*   `/client`: React frontend source code, including components, hooks, and pages.
*   `/server`: Express backend API, controllers, and middleware.
*   `/prisma`: Database schema definitions and migration scripts.
*   `/dist`: Output directory for production build artifacts.
*   `/types`: Global TypeScript interface and type definitions.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.