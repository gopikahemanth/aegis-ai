import { ContextEngine } from "./context-engine.js";

const engine = new ContextEngine();

const context = engine.build(
  "Create a dashboard with charts",
  "./generated/project",
);

console.log(context);
