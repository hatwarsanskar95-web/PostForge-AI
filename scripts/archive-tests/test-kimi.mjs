import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = 'https://api.openrouter.ai/api/v1/chat/completions';
async function test() {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'glm-4.6',
      messages: [{role: 'user', content: 'hello'}]
    })
  });
  console.log(res.status, await res.text());
}
test();
