import { GoogleGenAI } from "@google/genai";
import { env } from "./dist/utils/env.js";

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const res = await client.models.generateContent({
  model: "gemini-3.6-flash",
  contents: ["Say 'Hello from Gemini 3.6!'"]
});
console.log("RESPONSE TEXT:", res.text);
