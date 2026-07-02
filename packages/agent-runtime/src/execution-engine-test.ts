import { ExecutionEngine } from "./execution-engine.js";

async function main() {
  const engine = new ExecutionEngine();

  const success = await engine.execute(
    "Create a simple HTML landing page."
  );

  console.log(success);
}

main();
