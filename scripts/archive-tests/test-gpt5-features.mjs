import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.BLUESMIND_API_KEY;
const baseUrl = 'https://api.bluesminds.com/v1/chat/completions';

async function testModel(modelName) {
  console.log(`\nTesting Model: ${modelName}`);
  try {
    const t0 = performance.now();
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Reply with exactly: Connection Successful' }]
      })
    });
    const t1 = performance.now();
    
    const text = await response.text();
    console.log(`Status: ${response.status} ${response.statusText} (Time: ${Math.round(t1-t0)}ms)`);
    
    if (response.ok) {
        try {
            const json = JSON.parse(text);
            console.log(`SUCCESS! Tokens Used:`, json.usage);
            console.log(`Response: ${json.choices?.[0]?.message?.content}`);
            return true;
        } catch(e) {
            console.log(`Failed to parse response:`, text);
        }
    } else {
        console.log(`Error Response:`, text);
    }
    return false;
  } catch (err) {
    console.error(`Network Error:`, err.message);
    return false;
  }
}

async function testImageInput(modelName) {
  console.log(`\nTesting Image Input for: ${modelName}`);
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
      body: JSON.stringify({
        model: modelName,
        messages: [{
          role: 'user', 
          content: [
            { type: "text", text: "What's in this image?" },
            { type: "image_url", image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" } }
          ]
        }]
      })
    });
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    if (response.ok) {
        console.log(`Image Input SUCCESS!`);
        return true;
    } else {
        console.log(`Error Response:`, text);
    }
    return false;
  } catch (err) {
    console.error(`Network Error:`, err.message);
    return false;
  }
}

async function run() {
  await testModel('gpt-5.5');
  await testImageInput('gpt-5.5');
}

run();
