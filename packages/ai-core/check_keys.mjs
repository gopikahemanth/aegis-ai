import { env } from "./dist/utils/env.js";

console.log("GEMINI_API_KEY:", !!env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY_2:", !!env.GEMINI_API_KEY_2);
console.log("GEMINI_API_KEY_3:", !!env.GEMINI_API_KEY_3);
console.log("GEMINI_API_KEY_4:", !!env.GEMINI_API_KEY_4);
console.log("GEMINI_API_KEY_5:", !!env.GEMINI_API_KEY_5);
console.log("GROQ_API_KEY:", !!env.GROQ_API_KEY);
console.log("CEREBRAS_API_KEY:", !!env.CEREBRAS_API_KEY);
console.log("OPENROUTER_API_KEY:", !!env.OPENROUTER_API_KEY);
console.log("GITHUB_TOKEN:", !!env.GITHUB_TOKEN);
