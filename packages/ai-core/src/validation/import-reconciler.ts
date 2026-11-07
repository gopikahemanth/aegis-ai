/**
 * ImportReconciler
 *
 * Deterministically reconciles and repairs common code generation discrepancies in TS/TSX:
 * 1. Missing Lucide icon imports: Detects Lucide icons used in JSX (e.g. <TrendingDown />)
 *    and ensures they are included in `import { ... } from "lucide-react"`.
 * 2. Missing React hook imports: Ensures `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`
 *    are present in the React import declaration when referenced in component code.
 * 3. Dual component exports: Ensures components have both named and default exports so that
 *    cross-file imports resolve cleanly whether using default or named syntax.
 */

import ts from "typescript";

// Common Lucide icon names frequently used across business, finance, e-commerce, and SaaS apps
const KNOWN_LUCIDE_ICONS = new Set([
  "TrendingDown", "TrendingUp", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
  "Check", "CheckCircle", "CheckCircle2", "AlertCircle", "AlertTriangle", "Info",
  "X", "XCircle", "Plus", "Minus", "Search", "Filter", "SlidersHorizontal",
  "Calendar", "Clock", "DollarSign", "CreditCard", "Wallet", "Building", "Building2",
  "Landmark", "Briefcase", "User", "Users", "UserPlus", "Settings", "Shield", "Lock",
  "Unlock", "Mail", "Phone", "MapPin", "ChevronRight", "ChevronLeft", "ChevronDown", "ChevronUp",
  "Menu", "Home", "LayoutDashboard", "FileText", "Folder", "BarChart", "BarChart2", "BarChart3",
  "PieChart", "LineChart", "Activity", "RefreshCw", "Download", "Upload", "Trash2", "Edit",
  "Eye", "EyeOff", "Star", "Sparkles", "Send", "Share2", "Bell", "HelpCircle", "ExternalLink",
  "Copy", "Percent", "Database", "Server", "Cpu", "HardDrive", "ShoppingCart", "ShoppingBag",
  "Package", "Tag", "Truck", "Layers", "Compass", "Globe", "Zap", "Flame", "Moon", "Sun"
]);

export class ImportReconciler {
  /**
   * Reconciles all imports, exports, and hook references in a TypeScript / TSX file.
   * Performs AST validation and safely rolls back if transformations corrupt syntax.
   */
  public static reconcile(content: string, filePath: string): string {
    if (!content || (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts"))) {
      return content;
    }

    let reconciled = content;

    // 1. Reconcile Lucide Icons in TSX files
    if (filePath.endsWith(".tsx")) {
      reconciled = this.reconcileLucideIcons(reconciled);
      reconciled = this.reconcileReactHooks(reconciled);
      reconciled = this.reconcileDualExports(reconciled);
    }

    // AST Safety Gate: Parse modified code with TypeScript compiler API.
    // If transformation introduced syntax errors that did not exist in the original,
    // fail safe by rolling back to original content.
    try {
      const sourceFile = ts.createSourceFile(
        filePath,
        reconciled,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      const diagnostics = (sourceFile as any).parseDiagnostics || [];
      if (diagnostics.length > 0) {
        const origFile = ts.createSourceFile(
          filePath,
          content,
          ts.ScriptTarget.Latest,
          true,
          filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );
        const origDiagnostics = (origFile as any).parseDiagnostics || [];
        if (diagnostics.length > origDiagnostics.length) {
          console.warn(`[ImportReconciler] ⚠️ AST parse diagnostics increased after reconciliation on ${filePath}. Rolling back safely.`);
          return content;
        }
      }
    } catch (err: any) {
      console.warn(`[ImportReconciler] ⚠️ AST validation threw on ${filePath}: ${err.message}. Retaining original content.`);
      return content;
    }

    return reconciled;
  }

  /**
   * Scans JSX for icons used like `<IconName ... />` and ensures they are imported from "lucide-react".
   */
  public static reconcileLucideIcons(content: string): string {
    // Detect all PascalCase elements used in JSX
    const jsxElementRegex = /<([A-Z][a-zA-Z0-9]+)\b[^>]*\/?>/g;
    const usedIcons = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = jsxElementRegex.exec(content)) !== null) {
      const tag = match[1];
      if (KNOWN_LUCIDE_ICONS.has(tag)) {
        usedIcons.add(tag);
      }
    }

    if (usedIcons.size === 0) {
      return content;
    }

    // Check existing runtime lucide-react import (excluding type-only imports)
    const lucideRuntimeImportRegex = /import\s+(?!type\b)\{([^}]+)\}\s*from\s*["']lucide-react["'];?/;
    const importMatch = content.match(lucideRuntimeImportRegex);

    if (importMatch) {
      const existingImports = importMatch[1]
        .split(",")
        .map(i => i.trim())
        .filter(Boolean);

      const existingSet = new Set(existingImports.map(i => i.split(/\s+as\s+/)[0].trim()));
      const missingIcons = Array.from(usedIcons).filter(icon => !existingSet.has(icon));
      const allUniqueImports = Array.from(new Set([...existingImports, ...missingIcons]));

      if (allUniqueImports.length !== existingImports.length || missingIcons.length > 0) {
        return content.replace(
          importMatch[0],
          `import { ${allUniqueImports.join(", ")} } from "lucide-react";`
        );
      }
    } else {
      // If no runtime import exists, add runtime import even if a type-only import exists
      const iconList = Array.from(usedIcons).sort().join(", ");
      const firstImportIdx = content.indexOf("import ");
      if (firstImportIdx !== -1) {
        return (
          content.slice(0, firstImportIdx) +
          `import { ${iconList} } from "lucide-react";\n` +
          content.slice(firstImportIdx)
        );
      } else {
        return `import { ${iconList} } from "lucide-react";\n` + content;
      }
    }

    return content;
  }

  /**
   * Ensures React hooks used in the file are imported from "react".
   */
  public static reconcileReactHooks(content: string): string {
    const HOOKS = ["useState", "useEffect", "useMemo", "useCallback", "useRef", "useReducer"];
    const usedHooks = HOOKS.filter(h => {
      const regex = new RegExp(`\\b${h}\\s*\\(`, "m");
      return regex.test(content);
    });

    if (usedHooks.length === 0) return content;

    const reactNamedImportRegex = /import\s+React\s*,\s*\{([^}]+)\}\s+from\s+["']react["'];?/;
    const reactHooksOnlyRegex = /import\s+(?!type\b)\{([^}]+)\}\s+from\s+["']react["'];?/;
    const reactDefaultOnlyRegex = /import\s+React\s+from\s+["']react["'];?/;

    if (reactNamedImportRegex.test(content)) {
      return content.replace(reactNamedImportRegex, (full, items) => {
        const existing = items.split(",").map((s: string) => s.trim()).filter(Boolean);
        const missing = usedHooks.filter(h => !existing.includes(h));
        if (missing.length === 0) return full;
        return `import React, { ${Array.from(new Set([...existing, ...missing])).join(", ")} } from "react";`;
      });
    }

    if (reactHooksOnlyRegex.test(content)) {
      return content.replace(reactHooksOnlyRegex, (full, items) => {
        const existing = items.split(",").map((s: string) => s.trim()).filter(Boolean);
        const missing = usedHooks.filter(h => !existing.includes(h));
        if (missing.length === 0) return full;
        return `import React, { ${Array.from(new Set([...existing, ...missing])).join(", ")} } from "react";`;
      });
    }

    if (reactDefaultOnlyRegex.test(content)) {
      return content.replace(
        reactDefaultOnlyRegex,
        `import React, { ${usedHooks.join(", ")} } from "react";`
      );
    }

    return content;
  }

  /**
   * Ensures primary components export both named and default symbols to avoid
   * import style mismatches across tasks.
   */
  public static reconcileDualExports(content: string): string {
    // If has: export default function ComponentName(...)
    const defaultFuncMatch = content.match(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/);
    if (defaultFuncMatch) {
      const componentName = defaultFuncMatch[1];
      const namedExportPattern = new RegExp(`export\\s*\\{[^}]*\\b${componentName}\\b[^}]*\\}`);
      const directNamedPattern = new RegExp(`export\\s+(?:const|function|class)\\s+${componentName}\\b`);
      if (!namedExportPattern.test(content) && !directNamedPattern.test(content)) {
        return content.trimEnd() + `\n\nexport { ${componentName} };\n`;
      }
      return content;
    }

    // If has: export function ComponentName(...) without default export
    const namedFuncMatch = content.match(/export\s+function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/);
    if (namedFuncMatch && !/export\s+default\b/.test(content)) {
      const componentName = namedFuncMatch[1];
      return content.trimEnd() + `\n\nexport default ${componentName};\n`;
    }

    return content;
  }
}

