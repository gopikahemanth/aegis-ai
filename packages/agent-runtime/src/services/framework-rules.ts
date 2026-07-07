export interface FrameworkRule {
  requiredFiles: string[];
}

export const frameworkRules: Record<
  string,
  FrameworkRule
> = {
  html: {
    requiredFiles: [
      "index.html",
      "styles.css",
      "script.js",
    ],
  },

  react: {
    requiredFiles: [
      "package.json",
      "src",
    ],
  },

  next: {
    requiredFiles: [
      "package.json",
      "app",
    ],
  },
};
