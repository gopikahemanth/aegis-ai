# Robust Fullstack Todo App: A simple fullstack Todo application with dark mode and task management features

## Features
* Task creation with input validation
* Task completion toggle with dynamic update
* Task deletion with confirmation prompt
* Dark mode toggle with persisted theme preference
* Responsive design for various screen sizes

## Tech Stack
| Technology | Purpose |
| --- | --- |
| React | Frontend framework |
| Vite | Development server and build tool |
| TypeScript | Programming language |
| Express | REST API framework |
| Prisma | ORM for SQLite database |
| SQLite | Relational database management system |

## Getting Started
### Prerequisites
To run this project, you need Node.js (version 16 or higher) and a package manager (npm or yarn).

### Installation Steps
1. Clone the repository: `git clone https://github.com/your-username/robust-fullstack-todo-app.git`
2. Navigate to the project directory: `cd robust-fullstack-todo-app`
3. Install dependencies: `npm install` or `yarn install`

### Environment Setup
1. Copy the example environment file: `cp .env.example .env`
2. Fill in the required environment variables in the `.env` file

### Running Locally
Start the development server: `npm run dev` or `yarn dev`

## Available Scripts
* `npm run dev`: Start the development server
* `npm run build`: Build the application for production
* `npm run test`: Run unit tests and integration tests
* `npm run lint`: Check code for linting errors and formatting issues

## Project Structure
* `src`: Source code for the React application
* `src/features`: Feature-specific components and contexts
* `src/services`: API clients and data fetching utilities
* `prisma`: Prisma schema and database configuration

## License
This project is licensed under the MIT License.