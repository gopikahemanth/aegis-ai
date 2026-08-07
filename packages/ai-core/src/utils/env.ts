import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));

let current = __dirname;

while (!existsSync(join(current, "pnpm-workspace.yaml"))) {
  const parent = dirname(current);

  if (parent === current) {
    throw new Error("Could not locate repository root.");
  }

  current = parent;
}

dotenv.config({
  path: join(current, ".env"),
});

const schema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY_2: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_API_KEY: z.string().optional(),
  AI_PROVIDER: z
    .enum([
      "cerebras",
      "gemini",
      "groq",
      "openrouter",
      "github",
    ])
    .default("gemini"),
});
export const env = schema.parse(process.env);
