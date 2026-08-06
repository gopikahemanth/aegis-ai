import { spawn, execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

console.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...\n");

if (!existsSync(".env")) {
  writeFileSync(".env", 'PORT=5000\nDATABASE_URL="file:./dev.db"\n', "utf8");
}

if (existsSync("prisma/schema.prisma")) {
  console.log("📦 Syncing Prisma Database Schema & Generating Client...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (err) {
    console.warn("Warning: Prisma database sync skipped:", err.message);
  }
}

const server = spawn("npx", ["tsx", "server/index.ts"], { stdio: "inherit", shell: true });
const vite = spawn("npx", ["vite"], { stdio: "inherit", shell: true });

process.on("SIGINT", () => { server.kill(); vite.kill(); process.exit(); });
process.on("SIGTERM", () => { server.kill(); vite.kill(); process.exit(); });
