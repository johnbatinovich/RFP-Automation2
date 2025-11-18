// Test script to diagnose OpenAI API issues
// Run with: node test_openai_api.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";

console.log("=== OpenAI API Diagnostic Test ===\n");

// Check environment variables
console.log("1. Environment Variables:");
console.log(`   OPENAI_API_KEY: ${OPENAI_API_KEY ? `Set (${OPENAI_API_KEY.length} chars)` : "NOT SET"}`);
console.log(`   OPENAI_API_BASE: ${OPENAI_API_BASE}\n`);

if (!OPENAI_API_KEY) {
  console.error("❌ ERROR: OPENAI_API_KEY is not set!");
  console.log("\nPlease set the environment variable:");
  console.log("  export OPENAI_API_KEY='your-api-key-here'\n");
  process.exit(1);
}

// Test API connection
async function testOpenAIAPI() {
  console.log("2. Testing API Connection...");
  
  const url = `${OPENAI_API_BASE.replace(/\/$/, "")}/chat/completions`;
  console.log(`   Endpoint: ${url}\n`);
  
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Say 'API test successful' if you can read this."
      }
    ],
    max_tokens: 50
  };
  
  try {
    console.log("3. Sending test request...");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Request Failed:");
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorText}\n`);
      
      // Parse error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error("   Error Details:");
        console.error(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Error text is not JSON
      }
      
      return false;
    }
    
    const result = await response.json();
    console.log("✅ API Test Successful!");
    console.log("\n4. Response:");
    console.log(`   Model: ${result.model}`);
    console.log(`   Content: ${result.choices[0]?.message?.content}`);
    console.log(`   Tokens: ${result.usage?.total_tokens || 'N/A'}\n`);
    
    return true;
  } catch (error) {
    console.error("❌ Exception occurred:");
    console.error(`   ${error.message}\n`);
    console.error("   Stack trace:");
    console.error(error.stack);
    return false;
  }
}

// Test RFP analysis
async function testRFPAnalysis() {
  console.log("\n5. Testing RFP Analysis...");
  
  const url = `${OPENAI_API_BASE.replace(/\/$/, "")}/chat/completions`;
  
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert RFP analyzer. Extract key information from RFP documents including requirements, deadlines, evaluation criteria, and budget constraints."
      },
      {
        role: "user",
        content: `Analyze this RFP content and provide a structured summary of:
1. Key requirements
2. Evaluation criteria
3. Target audience
4. Success metrics

RFP CONTENT:
Title: Q3 Digital Media Campaign
Company: MediaBuyers Agency
Value: $500K - $750K
Due Date: April 15, 2025

We are seeking a media partner to execute our Q3 digital media campaign targeting tech-savvy millennials and Gen Z consumers. The campaign will focus on smartphone launches and accessories.

Requirements:
- Proven experience with tech product launches
- Multi-platform digital media capabilities
- Advanced audience targeting and analytics
- Competitive pricing with performance guarantees

Provide the analysis in a clear, structured format.`
      }
    ],
    max_tokens: 1000
  };
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ RFP Analysis Failed:");
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorText}\n`);
      return false;
    }
    
    const result = await response.json();
    console.log("✅ RFP Analysis Successful!");
    console.log("\n   Analysis Result:");
    console.log("   " + "=".repeat(60));
    console.log(result.choices[0]?.message?.content);
    console.log("   " + "=".repeat(60));
    console.log(`\n   Tokens used: ${result.usage?.total_tokens || 'N/A'}\n`);
    
    return true;
  } catch (error) {
    console.error("❌ Exception occurred:");
    console.error(`   ${error.message}\n`);
    return false;
  }
}

// Run tests
(async () => {
  const basicTestPassed = await testOpenAIAPI();
  
  if (basicTestPassed) {
    await testRFPAnalysis();
  }
  
  console.log("\n=== Test Complete ===\n");
})();
