/**
 * DatabaseInitializationStep
 *
 * Responsible for running Prisma schema generation and database migrations
 * on a generated project. This step runs after dependency installation and
 * before the production build so that:
 *
 * 1. Prisma client is generated (prisma generate)
 * 2. Database schema is applied (prisma db push for SQLite / migrate deploy for Postgres)
 * 3. The result is reported to the caller so the FinalSuccessGate can record
 *    the correct databaseStatus ("CONNECTED" | "BLOCKED" | "UNKNOWN").
 *
 * This step is intentionally non-fatal for SQLite projects — a missing or
 * unconfigured database is reported as BLOCKED but does not stop the build.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TerminalRunner } from "@aegis/project-builder";

export type DatabaseInitStatus =
  | "SKIPPED"       // No Prisma schema found — not a database project
  | "CONNECTED"     // Prisma generate + db push succeeded
  | "BLOCKED"       // DATABASE_URL missing or migration failed but non-fatal
  | "FAILED";       // Unexpected error that likely breaks the build

export interface DatabaseInitResult {
  status: DatabaseInitStatus;
  message: string;
  prismaGenerated: boolean;
  migrationApplied: boolean;
  databaseProvider?: string;
}

export class DatabaseInitializationStep {
  private readonly terminal = new TerminalRunner();

  /**
   * Detects and initializes the database for a generated project.
   *
   * @param projectPath  Absolute path to the generated project root.
   * @param packageManager  "pnpm" | "npm" | "yarn"
   */
  public async run(
    projectPath: string,
    packageManager: "pnpm" | "npm" | "yarn" = "pnpm",
  ): Promise<DatabaseInitResult> {
    // 1. Check whether the project has a Prisma schema
    const schemaPath = join(projectPath, "prisma", "schema.prisma");
    if (!existsSync(schemaPath)) {
      return {
        status: "SKIPPED",
        message: "No Prisma schema found — skipping database initialization.",
        prismaGenerated: false,
        migrationApplied: false,
      };
    }

    // 2. Detect the Prisma provider from schema
    let schemaContent = "";
    try {
      schemaContent = readFileSync(schemaPath, "utf8");
    } catch {
      return {
        status: "SKIPPED",
        message: "Could not read Prisma schema — skipping database initialization.",
        prismaGenerated: false,
        migrationApplied: false,
      };
    }

    const providerMatch = schemaContent.match(/provider\s*=\s*["']([^"']+)["']/);
    const databaseProvider = providerMatch?.[1] ?? "unknown";
    console.log(`[DatabaseInit] Prisma schema detected. Provider: "${databaseProvider}"`);

    // 3. Check DATABASE_URL for non-SQLite providers
    if (databaseProvider !== "sqlite") {
      const envPath = join(projectPath, ".env");
      const hasEnvFile = existsSync(envPath);
      const envContent = hasEnvFile ? readFileSync(envPath, "utf8") : "";
      const hasDatabaseUrl =
        envContent.includes("DATABASE_URL") ||
        Boolean(process.env.DATABASE_URL);

      if (!hasDatabaseUrl) {
        console.warn(
          `[DatabaseInit] ⚠️ DATABASE_URL not found for provider "${databaseProvider}". ` +
          `Database initialization blocked. Set DATABASE_URL in .env to enable persistence.`
        );
        return {
          status: "BLOCKED",
          message: `DATABASE_URL not configured for provider "${databaseProvider}". Set DATABASE_URL in .env.`,
          prismaGenerated: false,
          migrationApplied: false,
          databaseProvider,
        };
      }
    }

    // 4. Run prisma generate
    console.log(`[DatabaseInit] Running prisma generate...`);
    const generateResult = await this.runPrismaCommand(
      projectPath,
      packageManager,
      ["prisma", "generate"],
    );

    if (generateResult.exitCode !== 0) {
      console.warn(`[DatabaseInit] prisma generate failed (exit ${generateResult.exitCode}):`);
      console.warn(generateResult.stderr.slice(0, 500));
      return {
        status: "FAILED",
        message: `prisma generate failed: ${generateResult.stderr.slice(0, 300)}`,
        prismaGenerated: false,
        migrationApplied: false,
        databaseProvider,
      };
    }

    console.log(`[DatabaseInit] ✓ prisma generate succeeded.`);

    // 5. Run database migration / schema push
    // For SQLite in development: use "prisma db push" (simpler, no migration history needed)
    // For PostgreSQL/MySQL: use "prisma migrate deploy" if migrations exist, else "prisma db push"
    const migrationsDir = join(projectPath, "prisma", "migrations");
    const hasMigrations = existsSync(migrationsDir);

    let migrationCommand: string[];
    if (databaseProvider === "sqlite" || !hasMigrations) {
      migrationCommand = ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"];
    } else {
      migrationCommand = ["prisma", "migrate", "deploy"];
    }

    console.log(`[DatabaseInit] Running: ${migrationCommand.join(" ")}...`);
    const migrateResult = await this.runPrismaCommand(
      projectPath,
      packageManager,
      migrationCommand,
    );

    if (migrateResult.exitCode !== 0) {
      const isEnvError =
        migrateResult.stderr.includes("P1001") ||
        migrateResult.stderr.includes("ECONNREFUSED") ||
        migrateResult.stderr.includes("DATABASE_URL") ||
        migrateResult.stderr.includes("Can't reach database");

      if (isEnvError) {
        console.warn(
          `[DatabaseInit] ⚠️ Database unreachable during migration. ` +
          `This is an environment issue — marking as BLOCKED (not a code error).`
        );
        return {
          status: "BLOCKED",
          message: `Database unreachable: ${migrateResult.stderr.slice(0, 300)}`,
          prismaGenerated: true,
          migrationApplied: false,
          databaseProvider,
        };
      }

      console.error(`[DatabaseInit] ❌ Migration failed (exit ${migrateResult.exitCode}):`);
      console.error(migrateResult.stderr.slice(0, 500));
      return {
        status: "FAILED",
        message: `Migration failed: ${migrateResult.stderr.slice(0, 300)}`,
        prismaGenerated: true,
        migrationApplied: false,
        databaseProvider,
      };
    }

    console.log(`[DatabaseInit] ✓ Database initialized and schema applied.`);
    return {
      status: "CONNECTED",
      message: `Database initialized successfully (provider: ${databaseProvider}).`,
      prismaGenerated: true,
      migrationApplied: true,
      databaseProvider,
    };
  }

  /**
   * Runs a Prisma CLI command via the project's local node_modules.
   * Uses `npx prisma` / `pnpm exec prisma` to avoid global dependency on Prisma.
   */
  private async runPrismaCommand(
    projectPath: string,
    packageManager: "pnpm" | "npm" | "yarn",
    args: string[],
  ) {
    // Map package manager to its exec command
    // pnpm exec, npx, yarn exec — all invoke local binaries
    let command: string;
    let commandArgs: string[];

    if (packageManager === "pnpm") {
      command = "pnpm";
      commandArgs = ["exec", ...args];
    } else if (packageManager === "yarn") {
      command = "yarn";
      commandArgs = args;
    } else {
      command = "npx";
      commandArgs = ["--yes", ...args];
    }

    return this.terminal.run(command, commandArgs, projectPath, 60_000);
  }
}
