import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = 'https://api.openrouter.ai/api/v1/chat/completions';

const base64Pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function testImageInput(modelName) {
  console.log(`\nTesting Image Input (base64) for: ${modelName}`);
  try {
    const t0 = performance.now();
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{
          role: 'user', 
          content: [
            { type: "text", text: "What color is this 1x1 pixel image?" },
            { type: "image_url", image_url: { url: base64Pixel } }
          ]
        }]
      })
    });
    const t1 = performance.now();
    const text = await response.text();
    console.log(`Status: ${response.status} (Time: ${Math.round(t1-t0)}ms)`);
    if (response.ok) {
        try {
            const json = JSON.parse(text);
            console.log(`Image Input SUCCESS!`);
            console.log(`Response: ${json.choices?.[0]?.message?.content}`);
        } catch(e) {
             console.log(`Response: ${text}`);
        }
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
  await testImageInput(process.env.IMAGE_MODEL || 'glm-4.6');
}

run();
