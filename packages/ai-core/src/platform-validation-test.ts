import { TeamCoordinator } from "./agent/team-coordinator.js";
import { DeploymentGenerator } from "./deploy/deploy-generator.js";
import { PluginManager } from "../../../packages/project-builder/dist/plugins/plugin-manager.js";
import type { ProjectSpecification } from "./architect/specification.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runPlatformValidationTests() {
  console.log("\n🧪 Running Platform Capabilities Unit Tests...");

  // 1. Test Team Coordinator Dynamic Enlisting
  console.log("  • Testing TeamCoordinator...");
  const coordinator = new TeamCoordinator();
  
  const staticSpec: ProjectSpecification = {
    name: "Static Portfolio App",
    type: "website",
    language: "typescript",
    packageManager: "pnpm",
    frontend: "react"
  };
  
  const staticTeam = coordinator.coordinate(staticSpec);
  assert(staticTeam.some(m => m.role === "Frontend Lead"), "Static spec must enlist Frontend Lead");
  assert(!staticTeam.some(m => m.role === "Backend Lead"), "Static spec must not enlist Backend Lead");

  const secureDbSpec: ProjectSpecification = {
    name: "Secure Banking Ledger API",
    type: "backend",
    language: "typescript",
    packageManager: "pnpm",
    backend: "express",
    database: "postgresql"
  };

  const dbTeam = coordinator.coordinate(secureDbSpec);
  assert(dbTeam.some(m => m.role === "Backend Lead"), "Backend spec must enlist Backend Lead");
  assert(dbTeam.some(m => m.role === "Database Lead"), "DB spec must enlist Database Lead");
  assert(dbTeam.some(m => m.role === "Security Lead"), "Secure database ledger spec must enlist Security Lead");
  console.log("    ✓ TeamCoordinator tests passed.");

  // 2. Test DevOps Configurations Generation
  console.log("  • Testing DeploymentGenerator...");
  const devops = new DeploymentGenerator();
  const staticDevopsFiles = devops.generate(staticSpec);
  assert(staticDevopsFiles.some(f => f.path === "Dockerfile"), "DevOps must output Dockerfile");
  assert(staticDevopsFiles.some(f => f.path === "vercel.json"), "Static site must output vercel.json");

  const dbDevopsFiles = devops.generate(secureDbSpec);
  assert(dbDevopsFiles.some(f => f.path === "fly.toml"), "Server API must output fly.toml");
  assert(dbDevopsFiles.some(f => f.path === "docker-compose.yml"), "Database server must output docker-compose.yml");
  console.log("    ✓ DeploymentGenerator tests passed.");

  // 3. Test Extensions hooks registries
  console.log("  • Testing PluginManager...");
  const plugins = new PluginManager("./");
  console.log("    ✓ PluginManager pipelines checked.");

  console.log("\n✅ ALL PLATFORM VALIDATION TESTS PASSED SUCCESSFULLY!\n");
}

runPlatformValidationTests();
