import { ProjectScanner } from "./project-scanner.js";

const scanner = new ProjectScanner();

const files = scanner.scan("./generated/project");

console.log(files);
