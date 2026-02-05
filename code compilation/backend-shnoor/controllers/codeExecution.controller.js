import codeExecutionService from "../services/codeExecution.service.js";

class CodeExecutionController {
  async runCode(req, res) {
    try {
      console.log('Received code execution request');
      
      const { code, language } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: code and language' 
        });
      }
      
      if (code.length > 10000) {
        return res.status(400).json({ 
          success: false, 
          error: 'Code too large (max 10000 characters)' 
        });
      }
      
      console.log(`Executing ${language} code (${code.length} chars)`);
      
      const result = await codeExecutionService.executeCode(code, language);
      
      console.log(` Execution completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      });
    }
  }
  
  async healthCheck(req, res) {
    try {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      const version = await execPromise('docker --version');
      
      res.json({ 
        status: 'healthy',
        service: 'code-execution',
        docker: version.stdout.trim(),
        timestamp: new Date().toISOString(),
        supportedLanguages: ['python', 'javascript', 'java', 'cpp']
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: 'Docker not available: ' + error.message,
        message: 'Please start Docker Desktop'
      });
    }
  }
}

const codeExecutionController = new CodeExecutionController();
export default codeExecutionController;