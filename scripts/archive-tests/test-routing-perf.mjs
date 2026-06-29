import fetch from 'node-fetch'; // polyfill if needed

const BASE_URL = 'http://localhost:3000/api';

async function testApi(endpoint, payload) {
  console.log(`\nTesting: ${endpoint}`);
  const t0 = performance.now();
  
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const t1 = performance.now();
    const time = Math.round(t1 - t0);
    
    if (res.ok) {
        console.log(`[SUCCESS] ${endpoint} took ${time}ms`);
    } else {
        console.log(`[ERROR] ${endpoint} failed with ${res.status} in ${time}ms`);
        console.log(await res.text());
    }
  } catch(e) {
      console.log(`[NETWORK ERROR] ${e.message}`);
  }
}

async function run() {
  console.log("Starting Performance Routing Test with glm-4.6...");
  
  // 1. Test post-generator
  await testApi('/post-generator', {
    topic: 'Why AI is the future',
    tone: 'Professional',
    audience: 'Engineers',
    role: 'Software Developer'
  });
}

run();
