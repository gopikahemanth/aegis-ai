# ResuMatch AI

ResuMatch AI is a full-stack web application that leverages natural language processing to analyze resumes against job descriptions, providing instant match scores and actionable keyword optimization insights.

## Features

*   **Intelligent Resume Parsing**: Securely extracts text from PDF uploads using server-side processing.
*   **Real-time Match Scoring**: Calculates percentage-based similarity scores between resumes and job descriptions using vector-based keyword comparison.
*   **Gap Analysis**: Identifies missing critical keywords and skill sets required by the target job description.
*   **Detailed Breakdown**: Provides a side-by-side comparison of found vs. missing keywords to optimize resume content.
*   **Search History**: Persists previous scans in MongoDB for users to track their application progress over time.
*   **Responsive UI**: Built with React and Tailwind CSS for a seamless experience across devices.

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| React | Frontend UI library |
| TypeScript | Type safety and architectural consistency |
| Express.js | Backend REST API server |
| MongoDB | Document database for storing scan history |
| Mongoose | ODM for data modeling |
| PDF.js / pdf-parse | PDF extraction and text parsing |
| Tailwind CSS | Utility-first styling |

## Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm (v9.x or higher) or yarn (v1.22+)
*   MongoDB instance (Local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/resumatch-ai.git
   cd resumatch-ai
   ```

2. Install dependencies for both client and server:
   ```bash
   npm install
   cd client && npm install && cd ../server && npm install
   ```

### Environment Setup

1. Copy the example environment files in both `client/` and `server/` directories:
   ```bash
   cp .env.example .env
   ```

2. Update the `server/.env` file with your configuration:
   * `PORT`: Server port (default: 5000)
   * `MONGO_URI`: Your MongoDB connection string
   * `JWT_SECRET`: Secure string for authentication

### Running Locally

To start the development environment concurrently, run the following from the root directory:

```bash
npm run dev
```

## Available Scripts

*   `npm run dev`: Starts both client and server in development mode.
*   `npm run build`: Compiles the React frontend and compiles TypeScript server files.
*   `npm run test`: Executes the Jest test suite for backend logic.
*   `npm run lint`: Runs ESLint to identify code quality issues across the codebase.

## Project Structure

```text
/
├── client/           # React frontend application
│   ├── src/          # Components, hooks, and services
│   └── public/       # Static assets
├── server/           # Express backend API
│   ├── controllers/  # Request handlers
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API route definitions
│   └── utils/        # PDF parsing and NLP logic
└── package.json      # Root workspace configuration
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.