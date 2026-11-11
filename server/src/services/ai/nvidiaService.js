const OpenAI = require('openai');
const config = require('../../config/env');

let client = null;

function getOpenAIClient() {
  if (!config.nvidia.apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in backend .env.');
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
 * Execute actual NVIDIA inference with strict token limits and usage extraction.
 */
async function callNvidiaInference(messages, options = {}) {
  const openai = getOpenAIClient();
  const model = options.model || config.nvidia.model;
  const maxTokens = options.maxTokens || config.nvidia.maxOutputTokens;
  const timeoutMs = options.timeoutMs || config.nvidia.requestTimeoutMs;

  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.1, // low temperature for deterministic academic classification
      max_tokens: maxTokens
    }, {
      timeout: timeoutMs
    });

    const durationMs = Date.now() - startTime;
    const choice = response.choices?.[0];
    const rawContent = choice?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('NVIDIA API returned empty response content.');
    }

    return {
      success: true,
      content: rawContent,
      model: response.model || model,
      durationMs,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : null
    };
  } catch (error) {
    // Detect rate limit (HTTP 429)
    const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
    const isQuotaExhausted = error.message && (error.message.includes('quota') || error.message.includes('credit'));

    const errInfo = new Error(
      isRateLimit || isQuotaExhausted
        ? `NVIDIA Free Endpoint Rate Limit / Quota Exceeded (HTTP ${error.status || 429}): ${error.message}`
        : `NVIDIA Inference Failed: ${error.message}`
    );
    errInfo.status = error.status;
    errInfo.isRateLimit = isRateLimit || isQuotaExhausted;
    throw errInfo;
  }
}

module.exports = {
  callNvidiaInference,
  modelId: config.nvidia.model
};
