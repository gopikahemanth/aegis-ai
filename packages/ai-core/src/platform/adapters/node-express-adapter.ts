/**
 * Node.js / Express Backend Generation Adapter
 */

import {
  TechnologyGenerationAdapter,
  ProjectScaffoldOptions,
  ComponentGenerationOptions,
  AdapterGeneratedFile,
  FrameworkFamily,
} from "./technology-adapter.interface.js";
import { ResolvedTechnologyArchitectureContract } from "../stack-selection-intelligence.js";

export class NodeExpressAdapter implements TechnologyGenerationAdapter {
  readonly id = "node-express-adapter";
  readonly name = "Node.js Express Backend Adapter";
  readonly frameworkFamily: FrameworkFamily = "backend-node";
  readonly supportsLevel1 = false;
  readonly supportsLevel2 = true;
  readonly supportsLevel3 = true;

  canHandle(architecture: ResolvedTechnologyArchitectureContract): boolean {
    const be = (architecture.backend?.framework || "").toLowerCase();
    return be.includes("express") || be.includes("node");
  }

  async scaffoldProject(options: ProjectScaffoldOptions): Promise<AdapterGeneratedFile[]> {
    const { projectName, architecture, designSpec } = options;
    const title = designSpec.projectIdentity?.productName || projectName;

    return [
      {
        path: "server/package.json",
        purpose: "Express backend dependencies",
        content: JSON.stringify(
          {
            name: `${projectName}-server`,
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "tsx watch src/index.ts",
              build: "tsc",
              start: "node dist/index.js",
              test: "vitest run",
            },
            dependencies: {
              express: "^4.19.2",
              cors: "^2.8.5",
              dotenv: "^16.4.5",
              zod: "^3.23.8",
            },
            devDependencies: {
              typescript: "^5.5.3",
              "@types/express": "^4.17.21",
              "@types/cors": "^2.8.17",
              "@types/node": "^20.14.14",
              tsx: "^4.16.2",
              vitest: "^2.0.5",
            },
          },
          null,
          2
        ),
      },
      {
        path: "server/src/index.ts",
        purpose: "Express application server",
        content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '${title} Backend' });
});

app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(\`[Server] Running at http://localhost:\${port}\`);
});
`,
      },
      {
        path: "server/src/routes/index.ts",
        purpose: "Root Express API router",
        content: `import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/v1/status', (req, res) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString() });
});
`,
      },
    ];
  }

  async generateComponent(options: ComponentGenerationOptions): Promise<AdapterGeneratedFile> {
    const { componentName, role } = options;
    const content = `import { Router } from 'express';

export const ${componentName.toLowerCase()}Router = Router();

${componentName.toLowerCase()}Router.get('/', (req, res) => {
  res.json([{ id: 1, title: 'Sample ${componentName}', role: '${role}' }]);
});

${componentName.toLowerCase()}Router.post('/', (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body });
});
`;

    return {
      path: `server/src/routes/${componentName.toLowerCase()}.ts`,
      purpose: `Express route handler for ${componentName}`,
      content,
    };
  }

  async generateRouting(pages: Array<{ path: string; componentName: string; title: string }>): Promise<AdapterGeneratedFile> {
    const imports = pages
      .map((p) => `import { ${p.componentName.toLowerCase()}Router } from './${p.componentName.toLowerCase()}';`)
      .join("\n");
    const routes = pages
      .map((p) => `apiRouter.use('/${p.componentName.toLowerCase()}', ${p.componentName.toLowerCase()}Router);`)
      .join("\n");

    const content = `import { Router } from 'express';
${imports}

export const apiRouter = Router();

${routes}
`;

    return {
      path: "server/src/routes/manifest.ts",
      purpose: "Aggregated Express router endpoints",
      content,
    };
  }

  getToolingCommands() {
    return {
      installCommand: "npm install",
      devCommand: "npm run dev",
      buildCommand: "npm run build",
      testCommand: "npm test",
    };
  }
}
