import https from 'https';

const API_KEY = 'sk-xTGkJ6MtvME0QKXRSAkb3VubSNn8gWWka02NvxVwUfKyEsWa';
const BASE_URL = 'api.openrouter.ai/api';

const models = ['gpt-4o-mini', 'gpt-4o', 'DeepSeek-V4-Flash', 'glm-4.6', 'kimi-k2.5', 'gpt-5-mini', 'gpt-5-nano'];

function testModel(model) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say OK' }]
    });

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      rejectUnauthorized: false,
      timeout: 15000
    };

    const start = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        resolve({ model, status: res.statusCode, elapsed, body: data.substring(0, 300) });
      });
    });

    req.on('error', (e) => resolve({ model, status: 'ERR', elapsed: Date.now() - start, body: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ model, status: 'TIMEOUT', elapsed: 15000, body: 'timed out' }); });
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Testing OpenRouter models...\n');
  for (const model of models) {
    const result = await testModel(model);
    const ok = result.status === 200 ? '✅ WORKS' : `❌ ${result.status}`;
    console.log(`${ok} | ${result.model} | ${result.elapsed}ms`);
    if (result.status !== 200) console.log(`   → ${result.body}\n`);
    else console.log(`   → ${result.body.substring(0, 150)}\n`);
  }
})();
