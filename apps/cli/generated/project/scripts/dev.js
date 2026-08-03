import { spawn } from "node:child_process";

console.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...\n");

const server = spawn("npx", ["tsx", "server/index.ts"], {
  stdio: "inherit",
  shell: true,
});

const vite = spawn("npx", ["vite"], {
  stdio: "inherit",
  shell: true,
});

process.on("SIGINT", () => {
  server.kill();
  vite.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  server.kill();
  vite.kill();
  process.exit();
});
