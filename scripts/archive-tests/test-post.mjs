async function test() {
  const start = Date.now();
  console.log("Sending request to /api/post-generator...");
  
  try {
    const res = await fetch("http://localhost:3000/api/post-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "Learning AI",
        audience: "Developers",
        role: "Software Engineer"
      })
    });
    
    const time = Date.now() - start;
    console.log(`Response Time: ${time}ms`);
    console.log(`Status: ${res.status}`);
    
    const data = await res.json();
    console.log("\n--- Generated Post ---\n");
    console.log(data.post);
    console.log("\n----------------------\n");
  } catch(e) {
    console.error(e);
  }
}

test();
