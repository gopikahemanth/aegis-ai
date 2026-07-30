import { KnowledgeGraphEngine } from "@aegis/ai-core";

export async function queryCommand() {
  const question = process.argv.slice(3).join(" ");

  if (!question) {
    console.log("\n❌ Please provide a question for the Knowledge Graph.");
    console.log("Usage: node apps/cli/dist/index.js query \"<your question>\"");
    console.log("Examples:");
    console.log("  - query \"Why did we choose PostgreSQL?\"");
    console.log("  - query \"Which feature depends on authentication?\"");
    console.log("  - query \"What changed since last week?\"\n");
    return;
  }

  const projectPath = "./generated/project";
  const engine = new KnowledgeGraphEngine(projectPath);
  
  // Seed initial dummy node details to test out of box
  engine.seedDefaults();

  console.log(`\n🔍 Querying Aegis Memory Knowledge Graph for: "${question}"`);
  console.log("==================================================================");
  
  const response = engine.answerQuery(question);
  console.log(`\n${response}\n`);
  console.log("==================================================================\n");
}
