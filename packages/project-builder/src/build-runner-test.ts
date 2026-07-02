import { BuildRunner } from "./build-runner.js";

async function main() {
  const builder = new BuildRunner();

  const result = await builder.build(
    "pnpm",
    process.cwd(),
  );

  console.log(result);
}

main();
