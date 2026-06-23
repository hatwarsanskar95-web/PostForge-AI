import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const apiKey = process.env.BLUESMIND_API_KEY;
const baseURL = process.env.BLUESMIND_BASE_URL;
const model = process.env.AI_MODEL || 'gemini-3-flash-preview';

console.log(`\n--- BLUESMIND CONNECTION TEST ---`);
console.log(`API Key Found: ${apiKey ? 'Yes (starts with ' + apiKey.substring(0, 5) + '...)' : 'No'}`);
console.log(`Base URL: ${baseURL}`);
console.log(`Model: ${model}\n`);

if (!apiKey || apiKey === 'PASTE_MY_BLUESMIND_API_KEY_HERE') {
  console.error("❌ Error: Valid BLUESMIND_API_KEY not found in .env.local");
  process.exit(1);
}

const aiClient = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

async function testConnection() {
  try {
    console.log(`Sending test request to ${baseURL}...`);
    const response = await aiClient.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Say "Connection Successful" if you receive this.' }],
    });
    console.log(`\n✅ TEST SUCCESSFUL!`);
    console.log(`Response: ${response.choices[0]?.message?.content}`);
  } catch (error) {
    console.error(`\n❌ TEST FAILED`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    console.error(`\nTroubleshooting:`);
    console.error(`If the error is "Connection error" or "ENOTFOUND", the Base URL is incorrect.`);
  }
}

testConnection();
