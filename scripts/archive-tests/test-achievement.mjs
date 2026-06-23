const url = 'http://localhost:3000/api/achievement-generator';

async function test(name, body) {
  console.log(`\n--- Testing ${name} ---`);
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const text = await res.text();
  const end = Date.now();
  console.log(`Response Time: ${end - start}ms`);
  console.log(`Status: ${res.status}`);
  
  try {
    const data = JSON.parse(text);
    console.log("--- Generated Post ---");
    console.log(data.post);
    console.log("----------------------");
  } catch (e) {
    console.log("Raw Response:", text);
  }
}

async function run() {
  await test("Certification", {
    achievementType: "certification",
    title: "AWS Certified Solutions Architect",
    organization: "Amazon Web Services",
    keyTakeaway: "Deepened my understanding of scalable cloud infrastructure and secure network design."
  });

  await test("Hackathon", {
    achievementType: "hackathon",
    title: "Global AI Hackathon 2026",
    organization: "Major League Hacking",
    keyTakeaway: "Built a fully functional AI agent in 48 hours. Learned to debug under extreme pressure and coordinate seamlessly with a team."
  });

  await test("Internship", {
    achievementType: "internship",
    title: "Software Engineering Intern",
    organization: "Google",
    keyTakeaway: "Excited to contribute to global scale systems and learn from the best engineers."
  });
}

run();
