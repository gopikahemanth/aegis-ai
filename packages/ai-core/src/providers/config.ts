import type { ProviderName } from "./types.js";
import { Models } from "./models.js";

export interface ProviderConfig {
  defaultProvider: ProviderName;
  defaultModel: string;
}

export const providerConfig: ProviderConfig = {
  defaultProvider: "groq",
  defaultModel: Models.groq.default,
};
