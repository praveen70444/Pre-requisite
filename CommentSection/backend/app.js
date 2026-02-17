import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import firebaseAuth from "./middlewares/firebaseAuth.js";
import { generalLimiter, codeExecutionLimiter } from "./middlewares/rateLimiter.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentCoursesRoutes from "./routes/studentCourses.routes.js";
import examRoutes from "./routes/exam.routes.js";
import studentExamRoutes from "./routes/studentExam.routes.js";
import codeExecutionRoutes from "./routes/codeExecution.routes.js";
import examCodeEvaluationRoutes from './routes/examCodeEvaluation.routes.js';
import courseCommentsRoutes from "./routes/courseComments.routes.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
];

// Security headers
app.use(helmet());

// HTTP request logging
app.use(morgan("dev"));

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Global rate limiter (lightweight, for all routes)
app.use(generalLimiter);

app.use(express.json());

// ========== DEBUG & TEST ENDPOINTS (defined directly) ==========

// Quick test endpoint for code execution (auth required, rate limited)
app.post('/api/quick-test', firebaseAuth, codeExecutionLimiter, async (req, res) => {
  try {
    const { code, language } = req.body;
    console.log(' Quick test:', { language, codeLength: code?.length });
    
    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code and language are required' 
      });
    }
    
    // Route through shared execution service so concurrency limiting applies.
    const codeExecutionService = (await import('./services/codeExecution.service.js')).default;
    const result = await codeExecutionService.executeCode(code, language);

    return res.json({
      success: true,
      data: {
        success: result.success,
        output: result.output || '',
        error: result.error || '',
        executionTime: result.executionTime || 0
      }
    });
    
    // Legacy code below (should not be reached)
    if (false && language === 'javascript') {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      // Write to file to avoid quote issues
      const tempDir = path.join(os.tmpdir(), 'code-temp');
      await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
      
      const filename = `code_${Date.now()}.js`;
      const filepath = path.join(tempDir, filename);
      await fs.writeFile(filepath, code);
      
      // Convert Windows path for Docker
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm -v "${dockerPath}:/code.js" node:18-alpine node /code.js`;
      console.log('Command:', command.substring(0, 100) + '...');
      
      const { stdout, stderr } = await execPromise(command, {
        timeout: 10000,
        shell: true
      });
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});
      
      return res.json({
        success: true,
        data: {
          success: true,
          output: stdout.trim(),
          error: stderr.trim(),
          executionTime: 0
        }
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Only python and javascript supported in quick test'
    });
    
  } catch (error) {
    console.error('Quick test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Public test code endpoint (auth required, rate limited)
app.post('/api/public/test-code', firebaseAuth, codeExecutionLimiter, async (req, res) => {
  try {
    const { code, language, input, expectedOutput } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required"
      });
    }
    
    // Import the service
    const codeExecutionService = await import('./services/codeExecution.service.js');
    const service = codeExecutionService.default;
    
    const executionResult = await service.executeCodeWithInput(
      code,
      language,
      input || ""
    );
    
    const normalizedActual = service.normalizeOutput(executionResult.output);
    const normalizedExpected = service.normalizeOutput(expectedOutput || "");
    
    res.json({
      success: true,
      execution: executionResult,
      comparison: {
        actualOutput: normalizedActual,
        expectedOutput: normalizedExpected,
        passed: normalizedActual === normalizedExpected
      }
    });
    
  } catch (error) {
    console.error("Public test error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message
    });
  }
});

// ========== DEVELOPMENT TOKEN ENDPOINTS ==========
// Only enable in development mode
if (process.env.NODE_ENV !== 'production') {
  console.log('🔓 Development mode: Enabling dev token endpoints');
  
  // Generate custom dev tokens
  app.post('/api/dev/token', (req, res) => {
    const { role, userId, email, name } = req.body;
    
    const token = 'dev-token-' + Date.now();
    const user = {
      user_id: userId || 'dev-user-' + Math.random().toString(36).substr(2, 9),
      email: email || `${role || 'user'}@example.com`,
      role: role || 'student',
      name: name || `${role || 'User'} Name`
    };
    
    console.log(`🔑 Generated dev token for ${user.email} (${user.role})`);
    
    res.json({
      success: true,
      token: token,
      user: user,
      instructions: {
        usage: 'Use this token in Authorization header',
        example: `Authorization: Bearer ${token}`
      }
    });
  });
  
  // Get pre-defined tokens for quick testing
  app.get('/api/dev/tokens', (req, res) => {
    const tokens = {
      instructor: {
        token: 'dev-instructor-token',
        user: {
          user_id: 'dev-instructor-123',
          email: 'instructor@example.com',
          role: 'instructor',
          name: 'Test Instructor'
        }
      },
      student: {
        token: 'dev-student-token',
        user: {
          user_id: 'dev-student-123',
          email: 'student@example.com',
          role: 'student',
          name: 'Test Student'
        }
      },
      admin: {
        token: 'dev-admin-token',
        user: {
          user_id: 'dev-admin-123',
          email: 'admin@example.com',
          role: 'admin',
          name: 'Test Admin'
        }
      }
    };
    
    res.json({
      success: true,
      tokens: tokens,
      note: 'Use these tokens for testing different roles'
    });
  });
  
  // Test authentication endpoint
  app.get('/api/dev/test-auth', (req, res) => {
    res.json({
      success: true,
      message: 'Authentication test',
      headers: req.headers,
      user: req.user || { message: 'No user object found' },
      firebase: req.firebase || { message: 'No firebase object found' }
    });
  });
}

// Test echo endpoint
app.get('/api/test-echo', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/code/health',
      run: 'POST /api/code/run',
      quickTest: 'POST /api/quick-test',
      testEcho: 'GET /api/test-echo',
      publicTestCode: 'POST /api/public/test-code'
    },
    devEndpoints: process.env.NODE_ENV !== 'production' ? {
      getTokens: 'GET /api/dev/tokens',
      createToken: 'POST /api/dev/token',
      testAuth: 'GET /api/dev/test-auth'
    } : null
  });
});

// Debug routes endpoint
app.get('/api/debug-routes', (req, res) => {
  try {
    const routes = [];
    
    // Collect routes from app stack
    app._router.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        routes.push(`${methods.join(',')} ${layer.route.path}`);
      } else if (layer.name === 'router') {
        // Handle mounted routers
        layer.handle.stack.forEach((nestedLayer) => {
          if (nestedLayer.route) {
            const methods = Object.keys(nestedLayer.route.methods);
            const basePath = layer.regexp.toString().replace(/^\/\^\\\//, '').replace(/\\\/\?\(\?=\/\|\$\)\/\$/i, '');
            const fullPath = basePath + nestedLayer.route.path;
            routes.push(`${methods.join(',')} ${fullPath}`);
          }
        });
      }
    });
    
    res.json({
      message: 'Registered routes',
      total: routes.length,
      routes: routes.sort()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== REGISTER ALL ROUTE FILES ==========

// Exam code evaluation routes
app.use('/api/exam/code', examCodeEvaluationRoutes);

// Code execution routes
app.use('/api/code', codeExecutionRoutes);

// Other routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api", moduleRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentCoursesRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/student/exams", studentExamRoutes);
app.use("/api", courseCommentsRoutes);

// ========== ROOT ROUTE ==========
app.get("/", (req, res) => {
  res.json({ 
    message: "API is running 🚀",
    timestamp: new Date().toISOString(),
    services: {
      auth: "/api/auth",
      users: "/api/users",
      courses: "/api/courses",
      exams: "/api/exams",
      codeExecution: "/api/code",
      examEvaluation: "/api/exam/code"
    },
    testEndpoints: {
      quickTest: "POST /api/quick-test",
      publicTestCode: "POST /api/public/test-code",
      testEcho: "GET /api/test-echo",
      debugRoutes: "GET /api/debug-routes"
    },
    devEndpoints: process.env.NODE_ENV !== 'production' ? {
      getTokens: "GET /api/dev/tokens",
      createToken: "POST /api/dev/token"
    } : null
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  const availableEndpoints = [
    'GET  /',
    'GET  /api/test-echo',
    'POST /api/quick-test',
    'POST /api/public/test-code',
    'GET  /api/code/health',
    'POST /api/code/run',
    'GET  /api/debug-routes'
  ];
  
  // Add dev endpoints if in development
  if (process.env.NODE_ENV !== 'production') {
    availableEndpoints.push(
      'GET  /api/dev/tokens',
      'POST /api/dev/token',
      'GET  /api/dev/test-auth'
    );
  }
  
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
    availableEndpoints: availableEndpoints.sort()
  });
});

// ========== ERROR HANDLER ==========
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
  }
});