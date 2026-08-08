# Resume Oracle AI

An intelligent full-stack application for parsing resumes and analyzing keyword alignment against job descriptions using AI-driven scoring.

## Features

*   **PDF Parsing Engine:** Securely extracts text from uploaded PDF resumes using high-performance parsing libraries.
*   **AI-Powered Scoring:** Calculates a match percentage between candidate qualifications and job requirements.
*   **Keyword Extraction:** Automatically identifies essential skills, technologies, and certifications from both resume and job description inputs.
*   **Gap Analysis:** Provides a detailed breakdown of missing keywords required to improve resume alignment.
*   **Resume Database:** Persistent storage of parsed resume data and analysis history using PostgreSQL.
*   **Responsive Dashboard:** A clean, intuitive React interface for managing uploads and viewing real-time analytics.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React** | Frontend UI and component state management |
| **TypeScript** | Type-safe development across the entire stack |
| **Express** | RESTful API server |
| **PostgreSQL** | Relational database for storing user data and resumes |
| **Prisma** | ORM for database schema management and type-safe queries |
| **OpenAI API** | Natural language processing for keyword analysis |
| **Multer** | Middleware for handling multipart/form-data (file uploads) |

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm (v9.x or higher)
*   PostgreSQL (v15.x or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/resume-oracle-ai.git
   cd resume-oracle-ai
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   ```

3. Environment Setup:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and provide your configuration:
     - `DATABASE_URL`: Connection string for your PostgreSQL instance.
     - `OPENAI_API_KEY`: Your unique API key from OpenAI.
     - `PORT`: Preferred server port (default 3000).

4. Database Migration:
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

To run the client and server concurrently in development mode:
```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts the development server with hot reloading.
*   `npm run build`: Compiles the application for production deployment.
*   `npm run test`: Executes the test suite using Vitest/Jest.
*   `npm run lint`: Runs ESLint to identify code quality issues.
*   `npm run start`: Starts the production server build.

## Project Structure

```text
├── client/           # React frontend application
│   ├── src/          # Components, hooks, and pages
│   └── public/       # Static assets
├── server/           # Express backend API
│   ├── src/          # Controllers, routes, and services
│   └── prisma/       # Database schema and migration files
├── shared/           # Shared TypeScript interfaces
├── .env.example      # Environment variables template
└── package.json      # Dependencies and workspace scripts
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.