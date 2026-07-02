import { GroqProvider } from "../providers/groq.js";
import { Fixer } from "./fixer.js";

async function main() {
  const provider = new GroqProvider();

  const fixer = new Fixer(provider);

  const response = await fixer.fix(
    "Create a TypeScript app.",
    "Cannot find name 'hello'."
  );

  console.log(response);
}

main();
