import type { ProviderName } from "./types.js";
import { Models } from "./models.js";
import { env } from "../utils/env.js";

export interface ProviderConfig {
  defaultProvider: ProviderName;
  defaultModel: string;
}

export const providerConfig: ProviderConfig = {
  defaultProvider:
    env.AI_PROVIDER as ProviderName,

  defaultModel:
    Models[
      env.AI_PROVIDER as ProviderName
    ].default,
};
