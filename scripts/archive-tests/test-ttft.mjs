import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';

const aiClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

async function run() {
  console.log("Starting generation...");
  const t0 = performance.now();
  
  const stream = await aiClient.chat.completions.create({
    model: process.env.AI_MODEL || 'glm-4.6',
    messages: [{ role: 'user', content: 'Write a 100 word essay about AI.' }],
    stream: true,
  });

  let firstToken = null;
  let len = 0;
  for await (const chunk of stream) {
    if (!firstToken) {
        firstToken = performance.now();
        console.log(`First token took ${Math.round(firstToken - t0)}ms`);
    }
    len += (chunk.choices[0]?.delta?.content || '').length;
  }
  
  console.log(`Done in ${Math.round(performance.now() - t0)}ms. Output length: ${len}`);
}

run();
