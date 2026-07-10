import { EditEngine, GroqProvider } from "@aegis/ai-core";
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

  const editor =
    new EditEngine(
      provider,
    );

  console.log(
    `Editing project: ${projectPath}`,
  );

  const result =
    await editor.edit(
      instruction,
      projectPath,
    );

  console.log(result);
}
