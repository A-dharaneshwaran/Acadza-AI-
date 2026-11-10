const OpenAI = require('openai');
const config = require('../../config/env');

let client = null;

function getNvidiaClient() {
  if (!config.nvidia.apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in environment. Please provide your NVIDIA API key in .env');
  }

  if (!client) {
    client = new OpenAI({
      baseURL: config.nvidia.baseUrl,
      apiKey: config.nvidia.apiKey
    });
  }
  return client;
}

/**
 * Test connectivity and inference with the configured NVIDIA model
 */
async function testInference(prompt = 'Hello, answer with exactly "OK" if you can read this.') {
  if (!config.nvidia.apiKey) {
    return {
      success: false,
      configured: false,
      model: config.nvidia.model,
      message: 'NVIDIA_API_KEY is missing from environment (.env).'
    };
  }

  try {
    const openai = getNvidiaClient();
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: config.nvidia.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 60
    });
    const latency = Date.now() - startTime;

    return {
      success: true,
      configured: true,
      model: config.nvidia.model,
      latencyMs: latency,
      response: completion.choices[0]?.message?.content?.trim()
    };
  } catch (error) {
    return {
      success: false,
      configured: true,
      model: config.nvidia.model,
      error: error.message
    };
  }
}

module.exports = {
  getNvidiaClient,
  testInference,
  modelId: config.nvidia.model
};
