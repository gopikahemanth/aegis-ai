import { TerminalRunner } from "./terminal.js";

async function main() {
  const terminal = new TerminalRunner();

  const result = await terminal.run(
    "node",
    ["--version"],
    process.cwd(),
  );

  console.log(result);
}

main();
