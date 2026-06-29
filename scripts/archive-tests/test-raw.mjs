import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.AI_MODEL || 'gemini-3-flash-preview';
const baseUrl = 'https://api.openrouter.ai/api';

const payload = {
  model: model,
  messages: [{ role: 'user', content: 'Say "Connection Successful"' }]
};

async function testEndpoint(endpoint) {
  console.log(`\nTesting: ${baseUrl}${endpoint}`);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    try {
      const json = JSON.parse(text);
      console.log(`Response JSON:`, JSON.stringify(json, null, 2));
    } catch(e) {
      console.log(`Response Text:`, text);
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

async function run() {
  await testEndpoint('/v1/chat/completions');
  await testEndpoint('/v1/responses/compact');
}

run();
