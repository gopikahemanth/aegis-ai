import { AgentLoopRunner } from "./agent-loop-runner.js";

const runner =
  new AgentLoopRunner();

runner.run({
  request: "Create dashboard",
  framework: "react-vite",
  projectPath: "./generated/project",
  attempt: 1,
  generatedFiles: [],
  completed: false,
}).then(() => {
  console.log("Finished");
});
