import { GroqProvider } from "./providers/groq.js";

async function main() {
  const provider = new GroqProvider();

  const response = await provider.chat([
    {
      role: "user",
      content: "Say hello from Groq!",
    },
  ]);

  console.log(response);
}

main().catch(console.error);
