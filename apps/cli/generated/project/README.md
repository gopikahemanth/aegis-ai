# Task Master Pro: A Simple Fullstack Todo App
Task Master Pro is a fullstack Todo application built with Express REST API, Prisma SQLite database, and a React frontend.

## Features
* Dark mode for enhanced user experience
* Task creation with input validation
* Completion toggle for tasks
* Delete functionality for tasks
* Responsive design for various screen sizes

## Tech Stack
| Technology | Purpose |
| --- | --- |
| React | Frontend framework |
| Express | REST API framework |
| Prisma | SQLite database ORM |
| SQLite | Database management |
| TypeScript | Programming language |
| Vite | Development server and build tool |

## Getting Started
### Prerequisites
* Node version: 16 or higher
* Package manager: npm or yarn

### Installation Steps
1. Clone the repository: `git clone https://github.com/your-username/task-master-pro.git`
2. Install dependencies: `npm install` or `yarn install`
3. Copy the example environment file: `cp .env.example .env`
4. Fill in the environment variables in the `.env` file

### Environment Setup
Create a new file named `.env` in the root directory and add your environment variables.

### Running Locally
Start the development server: `npm run dev` or `yarn dev`

## Available Scripts
* `npm run dev` or `yarn dev`: Start the development server
* `npm run build` or `yarn build`: Build the application for production
* `npm run test` or `yarn test`: Run unit tests
* `npm run lint` or `yarn lint`: Run code linting

## Project Structure
* `prisma`: Prisma schema and database configuration
* `src`: React frontend code
* `src/api`: Express REST API code
* `src/components`: Reusable React components
* `src/utils`: Utility functions

## License
This project is licensed under the MIT License.