import 'dotenv/config';
import { generateAIContent } from './lib/ai/client';

async function testOpenRouter() {
  console.log("Testing primary text model...");
  const t0 = performance.now();
  const res = await generateAIContent('post-generator', 'Say OK.');
  console.log(`Response: ${res}`);
  console.log(`Time: ${performance.now() - t0}ms\n`);

  console.log("Testing image to post model...");
  const t1 = performance.now();
  // Using a 1x1 transparent pixel in base64
  const b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const res2 = await generateAIContent('image-to-post', 'What is this?', undefined, b64);
  console.log(`Response: ${res2}`);
  console.log(`Time: ${performance.now() - t1}ms`);
}

testOpenRouter();
