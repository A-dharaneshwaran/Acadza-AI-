
require('dotenv').config();

const OpenAI = require('openai');

async function testNvidia() {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.error('❌ NVIDIA_API_KEY is missing from .env');
    process.exit(1);
  }

  const client = new OpenAI({
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    apiKey
  });

  try {
    console.log('Connecting to NVIDIA...');

    const response = await client.chat.completions.create({
      model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4.1-flash',
      messages: [
        { role: 'user', content: 'Reply with exactly: NVIDIA API WORKING' }
      ],
      max_tokens: 30,
      temperature: 0
    });

    console.log('✅ API KEY VALID');
    console.log('Model:', response.model);
    console.log('Response:', response.choices[0].message.content);

  } catch (error) {
    console.error('❌ NVIDIA API TEST FAILED');
    console.error('Status:', error.status || 'Unknown');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testNvidia();
