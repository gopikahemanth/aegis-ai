import { DependencyInstaller } from "./installer.js";

async function main() {
  const installer = new DependencyInstaller();

  const result = await installer.install(
    "pnpm",
    process.cwd(),
  );

  console.log(result.exitCode);
}

main();
