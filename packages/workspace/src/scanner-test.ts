import { WorkspaceScanner } from "./scanner.js";

const scanner = new WorkspaceScanner();

console.log(scanner.scan("../../"));
