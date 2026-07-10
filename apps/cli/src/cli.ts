import { helpCommand } from "./commands/help.js";
import { versionCommand } from "./commands/version.js";
import { createCommand } from "./commands/create.js";
import { editCommand } from "./commands/edit.js";

export async function runCLI() {
  const command = process.argv[2];

  switch (command) {
    case "create":
      return createCommand();

    case "edit":
      return editCommand();

    case "version":
      return versionCommand();

    case "help":
      return helpCommand();

    default:
      return helpCommand();
  }
}
