async function checkModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  const data = await res.json();
  const models = data.data;

  const checkPriority = (keywords) => {
    return models.filter(m => keywords.every(kw => m.id.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw)));
  }

  console.log('--- GPT-5 ---');
  console.log(checkPriority(['gpt-5']).map(m => m.id));
  console.log('--- GLM-5 ---');
  console.log(checkPriority(['glm-5']).map(m => m.id));
  console.log('--- Gemini 2.5 Flash ---');
  console.log(checkPriority(['gemini', '2.5', 'flash']).map(m => m.id));
  console.log('--- Claude Sonnet ---');
  console.log(checkPriority(['claude', 'sonnet', '3.5']).map(m => m.id));
}
checkModels();
