import { WorkspaceScanner } from "./scanner.js";

const scanner = new WorkspaceScanner();

const project = scanner.scan("../../");

console.log(project);
