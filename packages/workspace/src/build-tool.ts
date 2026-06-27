export type BuildTool =
  | "turbo"
  | "vite"
  | "webpack"
  | "parcel"
  | "Unknown";

export class BuildToolDetector {
  detect(dependencies: string[]): BuildTool {
    if (dependencies.includes("turbo")) return "turbo";
    if (dependencies.includes("vite")) return "vite";
    if (dependencies.includes("webpack")) return "webpack";
    if (dependencies.includes("parcel")) return "parcel";

    return "Unknown";
  }
}
