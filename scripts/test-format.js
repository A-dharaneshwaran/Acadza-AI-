require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY
});

async function run() {
  const t0 = Date.now();
  console.log('Sending test prompt without response_format...');
  try {
    const res = await client.chat.completions.create({
      model: 'deepseek-ai/deepseek-v4.1-flash',
      messages: [
        { role: 'user', content: 'Output pure JSON: {"status": "ok", "verdict": "defect"}' }
      ],
      max_tokens: 100,
      temperature: 0.1
    }, { timeout: 180000 });
    console.log(`Success in ${Date.now() - t0} ms:`);
    console.log(res.choices[0].message.content);
    console.log('Usage:', res.usage);
  } catch (err) {
    console.error(`Failed in ${Date.now() - t0} ms:`, err.message);
  }
}

run();

