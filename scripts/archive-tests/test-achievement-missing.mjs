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
  await test("Empty Organization & Empty Takeaway Test", {
    achievementType: "certification",
    title: "Project Management Professional",
    organization: "",
    keyTakeaway: ""
  });
}

run();
