export class DependencyResolver {
  resolve(
    details: string,
  ): string[] {

    const packages =
      new Set<string>();

    const patterns = [
      /Cannot find module ['"]([^'"]+)['"]/g,
      /Cannot find package ['"]([^'"]+)['"]/g,
    ];

    for (const pattern of patterns) {
      for (const match of details.matchAll(pattern)) {
        packages.add(match[1]);
      }
    }

    return [...packages];
  }
}
