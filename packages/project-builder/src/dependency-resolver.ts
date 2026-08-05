export class DependencyResolver {
  resolve(
    details: string,
  ): string[] {

    const packages =
      new Set<string>();

    const patterns = [
      /Cannot find module ['"]([^'"]+)['"]/g,
      /Cannot find package ['"]([^'"]+)['"]/g,
      /Rollup failed to resolve import ['"]([^'"]+)['"]/g,
      /Failed to resolve import ['"]([^'"]+)['"]/g,
      /Could not resolve ['"]([^'"]+)['"]/g,
    ];

    for (const pattern of patterns) {
      for (const match of details.matchAll(pattern)) {
        const importPath = match[1];

        // Skip relative, path alias (@/), and absolute path imports
        if (
          importPath.startsWith(".") ||
          importPath.startsWith("/") ||
          importPath.startsWith("\\") ||
          importPath.startsWith("@/") ||
          /^[a-zA-Z]:/.test(importPath)
        ) {
          continue;
        }

        // Extract base package name
        let basePackage = importPath;
        if (importPath.startsWith("@")) {
          const parts = importPath.split("/");
          if (parts.length >= 2) {
            basePackage = parts.slice(0, 2).join("/");
          }
        } else {
          const parts = importPath.split("/");
          basePackage = parts[0];
        }

        packages.add(basePackage);
      }
    }

    return [...packages];
  }
}
