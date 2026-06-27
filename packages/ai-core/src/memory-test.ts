import { Memory } from "./agent/memory.js";

const memory = new Memory();

memory.add("Create a React app");
memory.add("Add authentication");
memory.add("Create dashboard");

console.log(memory.getAll());
