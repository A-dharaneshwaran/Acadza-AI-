const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  nvidia: {
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4.1-flash',
    apiKey: process.env.NVIDIA_API_KEY || '',
    maxOutputTokens: parseInt(process.env.NVIDIA_MAX_OUTPUT_TOKENS, 10) || 600,
    requestTimeoutMs: parseInt(process.env.NVIDIA_REQUEST_TIMEOUT, 10) || 240000, // 4 mins to safely accommodate NIM queueing
    maxConcurrentRequests: parseInt(process.env.NVIDIA_MAX_CONCURRENT_REQUESTS, 10) || 1
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'acadza_secret',
    adminEmail: process.env.ADMIN_EMAIL || 'acadzaaiintern@gmail.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'ACADZAAI!!#'
  }
};

