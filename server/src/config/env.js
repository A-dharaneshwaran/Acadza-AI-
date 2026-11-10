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
    apiKey: process.env.NVIDIA_API_KEY || ''
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'acadza_secret',
    adminEmail: process.env.ADMIN_EMAIL || 'acadzaaiintern@gmail.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'ACADZAAI!!#'
  }
};

