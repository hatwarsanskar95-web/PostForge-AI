import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.BLUESMIND_API_KEY;
const baseUrl = 'https://api.bluesminds.com/v1/chat/completions';
async function test() {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'kimi-k2.5',
      messages: [{role: 'user', content: 'hello'}]
    })
  });
  console.log(res.status, await res.text());
}
test();
