import { ProjectBuilder } from "./builder.js";

const builder = new ProjectBuilder();

builder.buildReactVite(
  "demo-app",
  "./generated-project"
);

console.log("Project created successfully!");
