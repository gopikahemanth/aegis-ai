import { GoogleGenAI } from "@google/genai";
import { env } from "./dist/utils/env.js";

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
for (const m of ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3-flash"]) {
  try {
    const res = await client.models.generateContent({
      model: m,
      contents: ["Say OK"],
      config: { maxOutputTokens: 10 }
    });
    console.log(m, "SUCCESS:", res.text?.trim());
  } catch (e) {
    console.log(m, "FAIL:", e.message);
  }
}
