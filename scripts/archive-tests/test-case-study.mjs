import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/case-study-forge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'PostForge AI',
      techStack: 'Next.js, Tailwind, Supabase, OpenAI API',
      features: 'AI Post Generator, Content Improver, Achievement Generator',
      challenges: 'Rate limiting on the AI API proxy caused timeout issues, but I fixed it by writing a better custom fetch wrapper.',
      projectLink: 'https://postforge.ai'
    })
  });
  const data = await res.json();
  console.log(data);
}

test();
