import { AgentLoop } from "./agent-loop.js";

const loop = new AgentLoop();

console.log(
  loop.next({
    request: "Create dashboard",
    framework: "react-vite",
    projectPath: "./generated/project",
    attempt: 1,
    generatedFiles: [],
    completed: false,
  }),
);
