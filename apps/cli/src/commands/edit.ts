import { EditPipeline } from "@aegis/agent-runtime";
import { GroqProvider } from "@aegis/ai-core";
import { resolve } from "node:path";

export async function editCommand() {
  const args = process.argv.slice(3);

  if (args.length < 2) {
    console.log(
      "Usage: aegis edit <project-path> <instruction>",
    );
    return;
  }

  const projectPath = resolve(args[0]);

  const instruction = args
    .slice(1)
    .join(" ");

  const provider =
    new GroqProvider();

 const pipeline =
  new EditPipeline(
    provider,
  );
  console.log(
    `Editing project: ${projectPath}`,
  );

 const result =
  await pipeline.execute(
    instruction,
    projectPath,
  );

  console.log(result);
}
