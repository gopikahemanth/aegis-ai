import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
