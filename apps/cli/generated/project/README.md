# Resume Keyword Scanner

A full-stack AI-powered application designed to analyze resumes against job descriptions, providing instant match scores and actionable keyword insights.

## Features

*   **PDF Parsing:** Extracts text content directly from uploaded resume files using server-side processing.
*   **Intelligent Keyword Extraction:** Utilizes AI integration to identify critical skills, technologies, and certifications from job descriptions.
*   **Automated Match Scoring:** Calculates a percentage-based relevance score based on keyword frequency and semantic matching.
*   **Gap Analysis:** Generates a detailed breakdown of missing skills and suggested keywords to improve resume performance.
*   **Scan History:** Persistent storage of past scan results via MongoDB for longitudinal tracking.
*   **Responsive UI:** A clean, React-based dashboard optimized for seamless document uploads and result viewing.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| TypeScript | Type-safe development |
| Express | Backend API server |
| MongoDB | Data persistence for scans and users |
| Mongoose | MongoDB object modeling |
| Multer | Middleware for handling PDF uploads |
| OpenAI API | Keyword extraction and semantic analysis |
| Tailwind CSS | Styling and responsive design |

## Getting Started

### Prerequisites

*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)
*   MongoDB instance (local or Atlas cluster)

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

1. Copy the example environment files:
   ```bash
   cp server/.env.example server/.env
   ```

2. Open `server/.env` and configure the following variables:
   *   `MONGODB_URI`: Your MongoDB connection string.
   *   `OPENAI_API_KEY`: Your private API key from OpenAI.
   *   `PORT`: Backend server port (default: 5000).

### Running Locally

To start the development environment (concurrently running client and server):

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts both frontend and backend development servers.
*   `npm run build`: Compiles the React app and transpile server code for production.
*   `npm run test`: Executes the test suite using Jest.
*   `npm run lint`: Runs ESLint to identify code quality issues and style violations.

## Project Structure

*   `/client`: Contains the React frontend application source code.
    *   `/src/components`: Reusable UI components.
    *   `/src/hooks`: Custom React hooks for API interaction.
*   `/server`: Contains the Express/Node.js backend.
    *   `/controllers`: Request handling logic for parsing and analysis.
    *   `/models`: Mongoose schemas for MongoDB.
    *   `/routes`: API endpoint definitions.
    *   `/utils`: Utility functions for PDF text extraction.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.