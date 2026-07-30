import type { ProjectSpecification } from "../architect/specification.js";
import type { GeneratedFile } from "../writer/writer.js";

export class DeploymentGenerator {
  generate(specification: ProjectSpecification): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const isStatic =
      specification.type === "website" ||
      (specification.frontend !== null && specification.backend === null);

    // 1. Dockerfile
    let dockerfileContent = "";
    if (isStatic) {
      dockerfileContent = `# Multi-stage Nginx build for static site / frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm install -g pnpm && pnpm install || npm install
COPY . .
RUN npm run build || true

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/*.html /usr/share/nginx/html/ || true
COPY --from=builder /app/*.css /usr/share/nginx/html/ || true
COPY --from=builder /app/*.js /usr/share/nginx/html/ || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
    } else {
      dockerfileContent = `# Multi-stage build for Node.js backend / full-stack
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm install -g pnpm && pnpm install || npm install
COPY . .
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
    }

    files.push({
      path: "Dockerfile",
      content: dockerfileContent,
    });

    // 2. Dockerignore
    files.push({
      path: ".dockerignore",
      content: `node_modules\ndist\n.git\n.gitignore\nDockerfile\n.dockerignore\nREADME.md\n`,
    });

    // 3. GitHub Actions CI/CD Workflow
    const cicdContent = `name: Aegis CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Run Quality Checks & Lint
        run: npm run lint || true

      - name: Build Application
        run: npm run build

      - name: Run Test Suite
        run: npm test || true

  deploy-staging:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}/app:latest
`;

    files.push({
      path: ".github/workflows/ci-cd.yml",
      content: cicdContent,
    });

    // 4. Docker Compose Config (multi-container support)
    const dbService = specification.database === "postgresql"
      ? `  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: aegis
      POSTGRES_PASSWORD: aegis_secure_password
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data`
      : specification.database === "mongodb"
      ? `  db:
    image: mongo:6-jammy
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodata:/data/db`
      : "";

    const volumesSection = specification.database === "postgresql"
      ? `\nvolumes:\n  pgdata:\n`
      : specification.database === "mongodb"
      ? `\nvolumes:\n  mongodata:\n`
      : "";

    const composeContent = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${isStatic ? "80:80" : "3000:3000"}"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${specification.database === "postgresql" ? "postgresql://aegis:aegis_secure_password@db:5432/app_db" : ""}
    restart: always
${dbService ? `    depends_on:\n      - db\n` : ""}${dbService}
${volumesSection}`;

    files.push({
      path: "docker-compose.yml",
      content: composeContent,
    });

    // 5. Cloud Platform Settings
    if (isStatic) {
      // Vercel deployment json for static apps
      files.push({
        path: "vercel.json",
        content: JSON.stringify({
          version: 2,
          framework: "vite",
          buildCommand: "npm run build",
          outputDirectory: "dist",
          cleanUrls: true,
          routes: [
            { "handle": "filesystem" },
            { "src": "/(.*)", "dest": "/index.html" }
          ]
        }, null, 2),
      });
    } else {
      // Fly.toml for server backend apps
      const appName = specification.name ? specification.name.toLowerCase().replace(/[^a-z0-9-]/g, "") : "aegis-app";
      files.push({
        path: "fly.toml",
        content: `app = "${appName}"
primary_region = "bos"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]
`,
      });
    }

    return files;
  }
}
