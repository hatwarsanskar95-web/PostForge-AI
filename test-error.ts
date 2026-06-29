import 'dotenv/config';
import { generateAIContent } from './lib/ai/client';

async function testError() {
  try {
    // We intentionally send a huge max_tokens or something to trigger an error, or just normal.
    await generateAIContent('post-generator', 'Say OK.');
  } catch (e: any) {
    console.log("CAUGHT ERROR:", e.message);
  }
}

testError();
