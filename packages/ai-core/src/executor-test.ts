import { Executor } from "./agent/executor.js";
import { GroqProvider } from "./providers/groq.js";

async function main() {
  const provider = new GroqProvider();
  const executor = new Executor(provider);

  const result = await executor.execute(
    "Build a React Todo App with TypeScript"
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
