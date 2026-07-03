import { ExecutionEngine } from "@aegis/agent-runtime";

export async function createCommand() {
  const prompt = process.argv.slice(3).join(" ");

  if (!prompt) {
    console.log("Please provide a prompt.");
    return;
  }

  const engine = new ExecutionEngine();

  const success = await engine.execute(prompt);

  if (success) {
    console.log("🎉 Project generated successfully.");
  } else {
    console.log("❌ Project generation failed.");
  }
}
