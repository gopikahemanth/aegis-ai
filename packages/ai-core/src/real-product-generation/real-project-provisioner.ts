/**
 * RealProjectProvisioner
 *
 * Actually creates the target project on disk: directories, package manifests, source scaffolding,
 * environment templates, and configuration files. No simulated or mock paths.
 */

import * as fs from "fs";
import * as path from "path";

export interface ProjectProvisioningResult {
  isProvisioned: boolean;
  projectPath: string;
  directoryCreated: boolean;
  packageManifestCreated: boolean;
  sourceScaffolded: boolean;
  configurationCreated: boolean;
  envTemplateCreated: boolean;
  requiredEnvVars: string[];
  summary: string;
}

export class RealProjectProvisioner {
  public static provision(productName: string, outputDirectory: string): ProjectProvisioningResult {
    const safeName = productName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const projectPath = path.join(outputDirectory, safeName);
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"];

    try {
      // Create directory structure
      const dirs = [
        projectPath,
        path.join(projectPath, "src"),
        path.join(projectPath, "src", "routes"),
        path.join(projectPath, "src", "models"),
        path.join(projectPath, "src", "middleware"),
        path.join(projectPath, "src", "services"),
        path.join(projectPath, "client", "src"),
        path.join(projectPath, "client", "src", "pages"),
        path.join(projectPath, "client", "src", "components"),
      ];
      dirs.forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

      // Package manifests
      fs.writeFileSync(
        path.join(projectPath, "package.json"),
        JSON.stringify({
          name: safeName,
          version: "1.0.0",
          scripts: { dev: "tsx src/index.ts", build: "tsc", start: "node dist/index.js" },
          dependencies: { express: "^4.18.0", prisma: "^5.0.0", bcryptjs: "^2.4.3", jsonwebtoken: "^9.0.0" },
        }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(projectPath, "client", "package.json"),
        JSON.stringify({
          name: `${safeName}-client`,
          version: "1.0.0",
          scripts: { dev: "vite", build: "vite build" },
          dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
          devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" },
        }, null, 2),
        "utf8"
      );

      // Minimal source scaffold
      fs.writeFileSync(
        path.join(projectPath, "src", "index.ts"),
        `import express from 'express';\nconst app = express();\napp.use(express.json());\napp.get('/health', (_, res) => res.json({ status: 'ok' }));\napp.listen(3001, () => console.log('Server running on :3001'));\n`,
        "utf8"
      );

      // Environment template
      fs.writeFileSync(
        path.join(projectPath, ".env.template"),
        requiredEnvVars.map((v) => `${v}=`).join("\n") + "\n",
        "utf8"
      );

      // TypeScript config
      fs.writeFileSync(
        path.join(projectPath, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { target: "ES2022", module: "commonjs", strict: true, outDir: "dist" } }, null, 2),
        "utf8"
      );

      return {
        isProvisioned: true,
        projectPath,
        directoryCreated: true,
        packageManifestCreated: true,
        sourceScaffolded: true,
        configurationCreated: true,
        envTemplateCreated: true,
        requiredEnvVars,
        summary: `Project provisioned at ${projectPath} with ${dirs.length} directories, package manifests, and environment templates.`,
      };
    } catch (err) {
      return {
        isProvisioned: false,
        projectPath,
        directoryCreated: fs.existsSync(projectPath),
        packageManifestCreated: false,
        sourceScaffolded: false,
        configurationCreated: false,
        envTemplateCreated: false,
        requiredEnvVars,
        summary: `Project provisioning failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
