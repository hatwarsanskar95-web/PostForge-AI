import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.BLUESMIND_API_KEY;
const baseUrl = 'https://api.bluesminds.com/v1/chat/completions';

const modelsToTest = [
  // Google Models
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview',
  
  // Non-Google Fallback Models
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'deepseek-chat',
  'qwen-turbo',
  'qwen-plus'
];

async function testModel(modelName) {
  console.log(`\nTesting Model: ${modelName}`);
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Reply with exactly: Connection Successful' }]
      })
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
        try {
            const json = JSON.parse(text);
            console.log(`SUCCESS! Response: ${json.choices?.[0]?.message?.content}`);
            return true;
        } catch(e) {
            console.log(`Failed to parse response:`, text);
        }
    } else {
        try {
            const json = JSON.parse(text);
            console.log(`Error:`, json.error?.message || json.error || text);
        } catch(e) {
            console.log(`Error Response:`, text);
        }
    }
    return false;
  } catch (err) {
    console.error(`Network Error:`, err.message);
    return false;
  }
}

async function run() {
  for (const model of modelsToTest) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n\n✅ Found working model: ${model}. Stopping tests.`);
      break;
    }
  }
}

run();
