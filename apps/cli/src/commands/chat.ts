import * as readline from "node:readline";
import * as process from "node:process";
import { ProviderFactory } from "@aegis/ai-core";

export async function chatCommand() {
  const provider = ProviderFactory.createDefaultProvider();

  const history: { role: "user" | "assistant"; content: string }[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const BANNER = `
╔══════════════════════════════════════════════════════╗
║           Aegis AI — Interactive Chat Mode           ║
║  Type your message and press Enter to send.          ║
║  Type  exit  or press Ctrl+C to quit.                ║
╚══════════════════════════════════════════════════════╝
`;
  console.log(BANNER);

  const SYSTEM_PROMPT = `You are Aegis AI, an expert autonomous software engineering assistant.
You help developers architect, debug, explain, and improve their codebases.
You give concise, accurate, production-quality answers.
When writing code, always write complete, working implementations — never pseudocode or stubs.`;

  const ask = () => {
    rl.question("You › ", async (userInput) => {
      const trimmed = userInput.trim();

      if (!trimmed) {
        ask();
        return;
      }

      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("\n👋 Exiting Aegis Chat. Goodbye!\n");
        rl.close();
        return;
      }

      history.push({ role: "user", content: trimmed });

      try {
        process.stdout.write("\nAegis › ");

        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ];

        const response = await provider.chat(messages, {
          temperature: 0.4,
        });

        const reply = response.trim();
        console.log(reply);
        console.log();

        history.push({ role: "assistant", content: reply });
      } catch (err: any) {
        console.error(`\n❌ Error: ${err.message}\n`);
      }

      ask();
    });
  };

  rl.on("SIGINT", () => {
    console.log("\n\n👋 Exiting Aegis Chat. Goodbye!\n");
    rl.close();
    process.exit(0);
  });

  ask();
}
