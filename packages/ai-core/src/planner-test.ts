
import { Planner } from "./agent/planner.js";

const planner = new Planner();

const plan = planner.createPlan("Build a React Todo App");

console.log(plan);
