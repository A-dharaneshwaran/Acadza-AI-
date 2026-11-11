const express = require('express');
const mongoose = require('mongoose');
const { modelId } = require('../services/ai/nvidiaService');
const config = require('../config/env');
const Question = require('../models/Question');
const Report = require('../models/Report');
const Taxonomy = require('../models/Taxonomy');
const InvestigationCase = require('../models/InvestigationCase');

const router = express.Router();

/**
 * GET /api/health
 * Returns service status, MongoDB connectivity, NVIDIA model status, and counts.
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbCounts = { questions: 0, reports: 0, taxonomy: false };

  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
      const [qCount, rCount, taxDoc, caseCount] = await Promise.all([
        Question.countDocuments(),
        Report.countDocuments(),
        Taxonomy.findById('acadza_taxonomy_v1'),
        InvestigationCase.countDocuments()
      ]);
      dbCounts = {
        questions: qCount,
        reports: rCount,
        taxonomy: !!taxDoc,
        investigationCases: caseCount
      };
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  // Static configuration check only - NEVER trigger live LLM inference on health checks
  const isHealthy = dbStatus === 'connected' && dbCounts.questions > 0;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Acadza Report->Fix Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      name: mongoose.connection.name || null,
      counts: dbCounts
    },
    ai: {
      provider: 'NVIDIA NIM Hosted API',
      configuredModel: modelId,
      endpoint: config.nvidia.baseUrl,
      apiKeyConfigured: !!config.nvidia.apiKey
    }
  });
});

module.exports = router;

