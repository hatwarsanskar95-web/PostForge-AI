import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = 'https://api.openrouter.ai/api/v1';

async function fetchModels() {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!res.ok) {
      console.log(`Failed to fetch models: ${res.status} ${res.statusText}`);
      console.log(await res.text());
      return;
    }
    
    const data = await res.json();
    const models = data.data;
    
    console.log(`Found ${models?.length || 0} models.`);
    const gpt5Models = models?.filter(m => m.id.toLowerCase().includes('gpt-5') || m.id.toLowerCase().includes('gpt5'));
    
    console.log('\nGPT-5 Models:');
    console.log(JSON.stringify(gpt5Models, null, 2));
    
  } catch(e) {
    console.error(e);
  }
}
fetchModels();
