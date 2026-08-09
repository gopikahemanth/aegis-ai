import { spawn, execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

console.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...\n");

if (!existsSync(".env")) {
  writeFileSync(".env", 'PORT=5000\nDATABASE_URL="file:./dev.db"\n', "utf8");
}

// Start Vite immediately so the sandbox health check can connect within 10s
const vite = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"], { stdio: "inherit", shell: true });

// Start Express backend (non-fatal — Vite will still serve the frontend if server fails)
const server = spawn("npx", ["tsx", "server/index.ts"], { stdio: "inherit", shell: true });
server.on("error", (err) => console.warn("⚠️ Backend server error (non-fatal):", err.message));

// Prisma sync in background (non-blocking)
if (existsSync("prisma/schema.prisma")) {
  setTimeout(() => {
    try {
      execSync("npx prisma db push --accept-data-loss --skip-generate", { stdio: "inherit" });
    } catch (err) {
      console.warn("Warning: Prisma database sync skipped:", err.message);
    }
  }, 2000);
}

process.on("SIGINT", () => { server.kill(); vite.kill(); process.exit(); });
process.on("SIGTERM", () => { server.kill(); vite.kill(); process.exit(); });
