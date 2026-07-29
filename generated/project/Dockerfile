# Multi-stage Nginx build for static site / frontend
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
