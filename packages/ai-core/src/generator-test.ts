import { Generator } from "./generator/generator.js";
import { GroqProvider } from "./providers/groq.js";

async function main() {
  const provider = new GroqProvider();
  const generator = new Generator(provider);

  const result = await generator.generate(
    "Create a simple HTML page with a heading saying Hello World."
  );

  console.log(result);
}

main().catch(console.error);
