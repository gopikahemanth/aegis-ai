import type { ProjectSpecification } from "../architect/specification.js";
import type { GeneratedFile } from "../writer/writer.js";

export class DeploymentGenerator {
  generate(specification: ProjectSpecification): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const isStatic =
      specification.type === "website" ||
      (specification.frontend !== null && specification.backend === null);

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

    files.push({
      path: ".dockerignore",
      content: `node_modules\ndist\n.git\n.gitignore\nDockerfile\n.dockerignore\nREADME.md\n`,
    });

    return files;
  }
}
