const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { connectDB } = require('./config/database');
const healthRoutes = require('./routes/healthRoutes');
const caseRoutes = require('./routes/caseRoutes');
const overviewRoutes = require('./routes/overviewRoutes');
const queueRoutes = require('./routes/queueRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin) || origin === config.frontendOrigin) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Route handlers
app.use('/api', healthRoutes);
app.use('/api', queueRoutes);
app.use('/api', caseRoutes);
app.use('/api', overviewRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Acadza Report -> Fix QA Engine API',
    version: '1.0.0',
    phase: '01 - Infrastructure & Data Import',
    health: '/api/health'
  });
});

let server = null;

async function startServer() {
  await connectDB();
  server = app.listen(config.port, () => {
    console.log(`[Server] Acadza Backend running on port ${config.port} (${config.nodeEnv})`);
    console.log(`[Server] Health check available at http://localhost:${config.port}/api/health`);
  });
  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('[Server] Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };

