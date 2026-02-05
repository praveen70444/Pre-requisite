import express from 'express';
import codeExecutionController from '../controllers/codeExecution.controller.js';
import firebaseAuth from '../middlewares/firebaseAuth.js';
import { codeExecutionLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Health check endpoint (no auth)
router.get('/health', codeExecutionController.healthCheck);

// Run code endpoint (auth + rate limited)
router.post('/run', firebaseAuth, codeExecutionLimiter, codeExecutionController.runCode);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Code execution API is working',
    endpoints: {
      health: 'GET /api/code/health',
      run: 'POST /api/code/run',
      test: 'GET /api/code/test'
    }
  });
});

export default router;