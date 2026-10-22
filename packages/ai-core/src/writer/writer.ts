import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { ASTSafeTransformer } from "../governance/ast-safe-transformer.js";
import { AuthorizedSchemaManager } from "../governance/authorized-schema-manager.js";
import { FileOwnershipRegistry, type SubsystemRole } from "../governance/file-ownership.js";

export interface GeneratedFile {
  path: string;
  content: string;
  callerRole?: SubsystemRole;
  owner?: SubsystemRole;
}

export interface FileWriterOptions {
  callerRole?: SubsystemRole;
  allowRegeneration?: boolean;
  repairTicketId?: string;
}

export class FileWriter {
  write(
    files: GeneratedFile[],
    outputDir: string,
    callerRoleOrOptions?: SubsystemRole | FileWriterOptions
  ): { written: string[]; blocked: string[] } {
    const options: FileWriterOptions =
      typeof callerRoleOrOptions === "string"
        ? { callerRole: callerRoleOrOptions }
        : callerRoleOrOptions || {};

    const written: string[] = [];
    const blocked: string[] = [];

    for (const file of files) {
      // Strip redundant outputDir prefixes or leading slashes from file.path
      let cleanRelativePath = file.path
        .replace(/\\/g, "/")
        .replace(/^(\.\/|\/)+/, "")
        .replace(/^(generated\/project\/|apps\/cli\/generated\/project\/)+/i, "");

      const effectiveRole: SubsystemRole =
        options.callerRole ||
        file.callerRole ||
        file.owner ||
        FileOwnershipRegistry.getDefaultOwnerForPath(cleanRelativePath);

      // Rule 2: Authoritative schema evolution via AuthorizedSchemaManager
      if (cleanRelativePath === "prisma/schema.prisma" || cleanRelativePath.endsWith("schema.prisma")) {
        const schemaResult = AuthorizedSchemaManager.reconcileAndWriteSchema(
          outputDir,
          file.content,
          effectiveRole
        );
        if (schemaResult.success) {
          written.push(cleanRelativePath);
        } else {
          blocked.push(cleanRelativePath);
        }
        continue;
      }

      // Rule 1: Single-owner authority validation at actual write boundary
      const writeAuth = FileOwnershipRegistry.canWrite(cleanRelativePath, effectiveRole, {
        isAuthorizedRegeneration: options.allowRegeneration,
        repairTicketId: options.repairTicketId,
      });

      if (!writeAuth.allowed) {
        console.warn(`[FileOwnership] ⛔ ${writeAuth.reason}`);
        blocked.push(cleanRelativePath);
        continue;
      }

      // Rule 6: Protect backend files (server/ and prisma/) from .ts -> .tsx mutation
      const isBackendFile = cleanRelativePath.startsWith("server/") || cleanRelativePath.startsWith("prisma/");

      // If a frontend .ts file contains JSX tags, convert extension to .tsx (frontend ONLY)
      if (!isBackendFile && cleanRelativePath.endsWith(".ts") && !cleanRelativePath.endsWith(".d.ts")) {
        const hasJsx =
          /<[A-Z][A-Za-z0-9]*[\s/>]/.test(file.content) ||
          /<(div|span|button|form|input|p|h[1-6]|a|ul|li|section|header|footer|main|nav)[\s/>]/.test(file.content) ||
          /<\/([A-Za-z0-9]+)>/.test(file.content);
        if (hasJsx) {
          cleanRelativePath = cleanRelativePath.replace(/\.ts$/, ".tsx");
        }
      }

      const fullPath = join(outputDir, cleanRelativePath);

      // Clean up conflicting alternate extension files
      if (fullPath.endsWith(".tsx")) {
        const altPath = fullPath.replace(/\.tsx$/, ".ts");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      } else if (fullPath.endsWith(".jsx")) {
        const altPath = fullPath.replace(/\.jsx$/, ".js");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      } else if (fullPath.endsWith(".js")) {
        const altPath = fullPath.replace(/\.js$/, ".jsx");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      }

      mkdirSync(dirname(fullPath), {
        recursive: true,
      });

      const transformed = ASTSafeTransformer.transformSource(file.content, cleanRelativePath);
      const finalContent = transformed.transformed ? transformed.code : file.content;
      writeFileSync(fullPath, finalContent, "utf8");
      FileOwnershipRegistry.registerOwner(cleanRelativePath, effectiveRole, options.allowRegeneration);
      written.push(cleanRelativePath);
    }

    return { written, blocked };
  }
}
