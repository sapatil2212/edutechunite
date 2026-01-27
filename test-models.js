const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get the API key from environment - you need to set this manually for testing
const apiKey = 'AIzaSyCOYZrIx_mutiEVI4Oi6uip25lqjuj7pG4';

if (!apiKey) {
  console.log('GEMINI_API_KEY is not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelNames = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro',
];

async function testModels() {
  console.log('Testing Gemini model availability...\n');
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`Testing ${modelName}...`);
      
      // Actually test the model with a simple request
      try {
        const result = await model.generateContent('Say hello in one word');
        const text = result.response.text();
        console.log(`✓ ${modelName} - WORKING! Response: ${text.trim().substring(0, 50)}`);
      } catch (callError) {
        console.log(`✗ ${modelName} - API Error: ${callError.message.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`✗ ${modelName} - Init Error: ${e.message}`);
    }
  }
}

testModels().then(() => {
  console.log('\nModel testing completed.');
});