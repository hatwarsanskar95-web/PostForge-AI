import { generateAIContent } from './lib/ai/client.ts';
import { AI_CONFIG } from './lib/ai/config.ts';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Overwrite for test script
AI_CONFIG.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
AI_CONFIG.OPENROUTER_BASE_URL = 'https://api.openrouter.ai/api';
AI_CONFIG.ACTIVE_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

async function test() {
  console.log("Testing generation...");
  try {
    const res = await generateAIContent("Write a 2 sentence post about AI.", "You are a helpful assistant.");
    console.log(res);
  } catch(e) {
    console.error("FAILED:", e.message);
  }
}

test();
