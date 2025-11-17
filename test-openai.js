// Test OpenAI API connection
const apiKey = process.env.OPENAI_API_KEY;
const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";

console.log("Testing OpenAI API...");
console.log("API Base:", apiBase);
console.log("API Key length:", apiKey ? apiKey.length : 0);
console.log("API Key starts with:", apiKey ? apiKey.substring(0, 7) : "NOT SET");

async function testAPI() {
  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Say 'Hello, World!' if you're working correctly."
          }
        ],
        max_tokens: 50
      })
    });

    console.log("\nResponse status:", response.status);
    console.log("Response status text:", response.statusText);

    const data = await response.json();
    
    if (!response.ok) {
      console.error("\nError response:", JSON.stringify(data, null, 2));
    } else {
      console.log("\nSuccess! Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("\nFetch error:", error.message);
  }
}

testAPI();
