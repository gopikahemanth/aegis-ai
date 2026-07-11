import { reactRules } from "./react.js";
import { nextRules } from "./next.js";
import { expressRules } from "./express.js";
import { htmlRules } from "./html.js";

export class FrameworkPromptFactory {
  get(
    framework: string,
  ) {
    switch (framework) {
      case "react-vite":
        return reactRules();

      case "next":
        return nextRules();

      case "express":
        return expressRules();

      default:
        return htmlRules();
    }
  }
}
