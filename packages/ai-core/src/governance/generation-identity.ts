import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface GenerationIdentity {
  generationId: string;
  promptHash: string;
  canonicalSpecHash: string;
  architectureHash: string;
  designBriefHash: string;
  createdAt: string;
}

export class GenerationIdentityManager {
  public static hashContent(content: string | object | undefined | null): string {
    if (!content) return createHash("sha256").update("").digest("hex").slice(0, 16);
    const raw = typeof content === "string" ? content : JSON.stringify(content);
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }

  public static createIdentity(params: {
    prompt: string;
    canonicalSpec?: any;
    architecture?: any;
    designBrief?: any;
    generationId?: string;
  }): GenerationIdentity {
    const promptHash = this.hashContent(params.prompt);
    const canonicalSpecHash = this.hashContent(params.canonicalSpec);
    const architectureHash = this.hashContent(params.architecture);
    const designBriefHash = this.hashContent(params.designBrief);
    const timestamp = Date.now();
    const generationId = params.generationId || `gen_${timestamp}_${promptHash.slice(0, 8)}`;

    return {
      generationId,
      promptHash,
      canonicalSpecHash,
      architectureHash,
      designBriefHash,
      createdAt: new Date().toISOString()
    };
  }

  public static persistIdentity(projectRoot: string, identity: GenerationIdentity): void {
    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    const genPath = join(aegisDir, "generation.json");
    writeFileSync(genPath, JSON.stringify(identity, null, 2), "utf8");

    // Inject into index.html bootstrap boundary so runtime identity is tamper-proof
    this.injectBootstrapIdentity(projectRoot, identity);
  }

  public static loadIdentity(projectRoot: string): GenerationIdentity | null {
    const genPath = join(projectRoot, ".aegis", "generation.json");
    if (!existsSync(genPath)) return null;
    try {
      return JSON.parse(readFileSync(genPath, "utf8")) as GenerationIdentity;
    } catch {
      return null;
    }
  }

  public static injectBootstrapIdentity(projectRoot: string, identity: GenerationIdentity): void {
    const indexPath = join(projectRoot, "index.html");
    if (!existsSync(indexPath)) return;
    try {
      let html = readFileSync(indexPath, "utf8");
      const scriptTag = `<script id="__aegis_bootstrap__">window.__AEGIS_RENDER_STATE__ = Object.assign(window.__AEGIS_RENDER_STATE__ || {}, ${JSON.stringify({
        generationId: identity.generationId,
        promptHash: identity.promptHash,
        canonicalSpecHash: identity.canonicalSpecHash,
        architectureHash: identity.architectureHash,
        designBriefHash: identity.designBriefHash
      })});</script>`;

      // If already present, replace it; otherwise insert before </head> or <body>
      if (html.includes('id="__aegis_bootstrap__"')) {
        html = html.replace(/<script id="__aegis_bootstrap__">[\s\S]*?<\/script>/, scriptTag);
      } else if (html.includes("</head>")) {
        html = html.replace("</head>", `  ${scriptTag}\n</head>`);
      } else if (html.includes("<body>")) {
        html = html.replace("<body>", `<body>\n  ${scriptTag}`);
      } else {
        html = `${scriptTag}\n${html}`;
      }
      writeFileSync(indexPath, html, "utf8");
    } catch (err: any) {
      console.warn(`[GenerationIdentity] Could not inject bootstrap script into index.html: ${err.message}`);
    }
  }
}
