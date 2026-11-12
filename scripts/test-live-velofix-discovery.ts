import { ProviderFactory } from "../packages/ai-core/src/providers/factory.js";
import { ProductDiscoveryAgent } from "../packages/ai-core/src/agents/product-discovery-agent.js";
import { ProductUnderstanding } from "../packages/ai-core/src/design/product-understanding.js";

async function main() {
  console.log("=== Phase 4.7 Live AI Provider Generation Test ===");
  const provider = ProviderFactory.createDefaultProvider();
  console.log("Active Provider:", provider.name);

  const prompt =
    "Build VeloFix Cycles: a modern bicycle rental and workshop repair platform with customer rental discovery and booking, rental availability management, bicycle inventory specifications, repair service requests and work orders, mechanic assignment, multi-stage repair status tracking (diagnostic, in progress, parts pending, ready for pickup, completed), customer notifications, workshop spare parts tracking, and payment receipts.";

  console.log("\n[1] Running live AI call to verify connectivity & model...");
  const ping = await provider.chat([{ role: "user", content: "Ping: respond with 'PONG' and your model name in 10 words." }]);
  console.log("Provider Ping Response:", ping);

  console.log("\n[2] Executing ProductDiscoveryAgent.discover() using live AI provider...");
  const agent = new ProductDiscoveryAgent(provider);
  const characteristics = ProductUnderstanding.analyze(prompt);
  const startTime = Date.now();
  const discoveryResult = await agent.discover(prompt, characteristics as any);
  const duration = Date.now() - startTime;

  console.log(`\n=== Live AI Product Discovery Results (${duration}ms) ===`);
  console.log("Category Discovered:", discoveryResult.category);
  console.log("Experience Pattern:", discoveryResult.experiencePattern);
  console.log("Primary Landing Feature:", discoveryResult.primaryLandingFeature);
  console.log("Standard Features (" + (discoveryResult.standardFeatures?.length || 0) + "):");
  for (const f of discoveryResult.standardFeatures || []) {
    console.log(`  - [${f.name}]: ${f.description}`);
  }
  console.log("Differentiator Features (" + (discoveryResult.differentiatorFeatures?.length || 0) + "):");
  for (const f of discoveryResult.differentiatorFeatures || []) {
    console.log(`  - [${f.name}]: ${f.description}`);
  }
}

main().catch((err) => {
  console.error("Live AI Test FAILED:", err);
  process.exit(1);
});
