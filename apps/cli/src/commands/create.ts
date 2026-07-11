import { ExecutionEngine } from "@aegis/agent-runtime";
import { ProviderError } from "@aegis/ai-core";

export async function createCommand() {
  const prompt = process.argv.slice(3).join(" ");

  if (!prompt) {
    console.log("Please provide a prompt.");
    return;
  }

  const engine = new ExecutionEngine();

  console.log("Generating project...");

  try {
    const success = await engine.execute(prompt);

    if (success) {
      console.log("🎉 Project generated successfully.");
    } else {
      console.log("❌ Project generation failed.");
    }
 } catch (error: unknown) {
  if (error instanceof ProviderError) {
    console.log();
    console.log("❌ AI Provider Error");
    console.log();
    console.log(error.message);

    if (error.retryAfter !== undefined) {
      console.log();
      console.log(
        `Retry after approximately ${error.retryAfter} seconds.`,
      );
    }

    console.log();
    console.log("Suggestions:");
    console.log("• Wait for the provider quota to reset.");
    console.log("• Configure another AI provider.");
    console.log("• Upgrade your provider plan if needed.");

    return;
  }

  throw error;
}
}
