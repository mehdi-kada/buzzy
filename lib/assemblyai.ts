
import { AssemblyAI } from "assemblyai";

export const assClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!
});
