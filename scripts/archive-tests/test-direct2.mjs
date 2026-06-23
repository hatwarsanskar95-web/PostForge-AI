import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We must set process.env.BLUESMIND_API_KEY before importing client.ts
process.env.BLUESMIND_API_KEY = process.env.BLUESMIND_API_KEY;

const { generateAIContent } = await import('./lib/ai/client.ts');

async function test() {
  console.log("Testing generation...");
  try {
    const res = await generateAIContent("Write a 2 sentence post about AI.", "You are a helpful assistant.");
    console.log("RESULT:");
    console.log(res);
  } catch(e) {
    console.error("FAILED:", e);
  }
}

test();
