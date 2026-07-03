import { helpCommand } from "./commands/help.js";
import { versionCommand } from "./commands/version.js";

export async function runCLI() {
  const command = process.argv[2];

  switch (command) {
    case "version":
      return versionCommand();

    case "help":
      return helpCommand();

    default:
      return helpCommand();
  }
}
