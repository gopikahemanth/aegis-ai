import { DeterministicProjectFixer } from "./validation/deterministic-project-fixer.js";
import { resolve } from "node:path";

const projectPath = resolve("apps/cli/generated/project");
console.log("Fixing generated project at:", projectPath);
const report = DeterministicProjectFixer.fixProject(projectPath);
console.log("Fix report:", report);
