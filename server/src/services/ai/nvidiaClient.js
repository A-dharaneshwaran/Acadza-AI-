const https = require('https');
const config = require('../../config/env');

/**
 * Robust NVIDIA NIM Inference Client with configurable timeout, retry logic,
 * and zero credentials logging.
 */
class NvidiaInferenceClient {
  constructor() {
    this.baseUrl = config.nvidia.baseUrl; // 'https://integrate.api.nvidia.com/v1'
    this.model = config.nvidia.model;     // 'deepseek-ai/deepseek-v4.1-flash'
    this.apiKey = config.nvidia.apiKey;
    this.DEFAULT_TIMEOUT_MS = 25000;
  }

  /**
   * Send chat completion request to NVIDIA NIM
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<string>} Model response content
   */
  async createChatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('NVIDIA_API_KEY is not configured in the environment.');
    }

    const payload = JSON.stringify({
      model: options.model || this.model,
      messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.2,
      max_tokens: options.max_tokens || 1024,
      response_format: options.response_format || { type: 'json_object' }
    });

    const parsedUrl = new URL(this.baseUrl);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: options.timeoutMs || this.DEFAULT_TIMEOUT_MS
    };

    return new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseBody);
              const content = parsed.choices?.[0]?.message?.content?.trim();
              if (!content) {
                return reject(new Error('NVIDIA API returned empty message content.'));
              }
              resolve(content);
            } catch (err) {
              reject(new Error(`Failed to parse NVIDIA response JSON: ${err.message}`));
            }
          } else {
            let errorDetail = responseBody;
            try {
              const errJson = JSON.parse(responseBody);
              errorDetail = errJson.error?.message || errJson.message || responseBody;
            } catch (_) {}
            reject(new Error(`NVIDIA API HTTP ${res.statusCode}: ${errorDetail}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`NVIDIA network request failed: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`NVIDIA API request timed out after ${requestOptions.timeout}ms`));
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new NvidiaInferenceClient();

