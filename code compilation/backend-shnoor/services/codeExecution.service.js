import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import pLimit from 'p-limit';

const execPromise = util.promisify(exec);

// Concurrency limit: max N simultaneous Docker executions per process
const CONCURRENCY = parseInt(process.env.CODE_EXEC_CONCURRENCY, 10) || 5;
const execLimit = pLimit(CONCURRENCY);

class CodeExecutionService {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'code-exam-temp');
    this.initTempDir();
  }

  async runDockerCommand(command, options) {
    return await execLimit(() => execPromise(command, options));
  }

  async initTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async executeCode(code, language) {
    console.log(`[${language.toUpperCase()}] Executing code...`);
    
    try {
      if (language === 'python') {
        return await this.runPython(code);
      } else if (language === 'javascript') {
        return await this.runJavaScript(code);
      } else if (language === 'java') {
        return await this.runJava(code);
      } else if (language === 'cpp') {
        return await this.runCpp(code);
      } else {
        return {
          success: false,
          output: '',
          error: `Language "${language}" not supported. Use: python, javascript, java, cpp`,
          executionTime: 0
        };
      }
    } catch (error) {
      console.error('Execution error:', error);
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: 0
      };
    }
  }

  async runPython(code) {
    const startTime = Date.now();
    const filename = `code_${Date.now()}.py`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`Python file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/code.py" python:3.11-alpine python /app/code.py`;
      console.log(`Running: ${command.substring(0, 100)}...`);
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 10000,
        shell: true,
        windowsHide: true
      });
      
      await fs.unlink(filepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async runJavaScript(code) {
    const startTime = Date.now();
    const filename = `code_${Date.now()}.js`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`JavaScript file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/code.js" node:18-alpine node /app/code.js`;
      console.log(`Running: ${command.substring(0, 100)}...`);
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 10000,
        shell: true,
        windowsHide: true
      });
      
      await fs.unlink(filepath).catch(() => {});
      
      return {
        success: true,  
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async runJava(code) {
    const startTime = Date.now();
    const filename = `Main_${Date.now()}.java`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`Java file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/Main.java" openjdk:17-jdk-slim sh -c "cd /app && javac Main.java && java Main"`;
      console.log(`Running: ${command.substring(0, 100)}...`);
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 15000,
        shell: true,
        windowsHide: true
      });
      
      await fs.unlink(filepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async runCpp(code) {
    const startTime = Date.now();
    const filename = `program_${Date.now()}.cpp`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`C++ file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/program.cpp" gcc:latest sh -c "cd /app && g++ program.cpp -o program && ./program"`;
      console.log(`Running: ${command.substring(0, 100)}...`);
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 15000,
        shell: true,
        windowsHide: true
      });
      
      await fs.unlink(filepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // method for test case evaluation---------------------
  async evaluateWithTestCases(code, language, testCases) {
    const results = [];
    let totalTestCases = testCases.length;
    let passedTestCases = 0;
    
    console.log(`Evaluating ${language} code against ${totalTestCases} test cases`);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testResult = {
        testCaseId: i + 1,
        input: testCase.input,
        expectedOutput: testCase.expected_output,
        isHidden: testCase.is_hidden || false,
        passed: false
      };
      
      try {
        const executionResult = await this.executeCodeWithInput(code, language, testCase.input);
        
        testResult.actualOutput = executionResult.output;
        testResult.error = executionResult.error;
        testResult.executionTime = executionResult.executionTime;
        
        const normalizedActual = this.normalizeOutput(testResult.actualOutput);
        const normalizedExpected = this.normalizeOutput(testCase.expected_output);
        
        testResult.passed = normalizedActual === normalizedExpected;
        
        if (testResult.passed) {
          passedTestCases++;
        }
        
      } catch (error) {
        testResult.actualOutput = null;
        testResult.error = error.message;
        testResult.passed = false;
      }
      
      results.push(testResult);
    }
    
    const percentage = totalTestCases > 0 ? 
      Math.round((passedTestCases / totalTestCases) * 100) : 0;
    
    return {
      success: true,
      testResults: results,
      summary: {
        totalTestCases,
        passedTestCases,
        failedTestCases: totalTestCases - passedTestCases,
        percentage
      },
      passed: percentage === 100
    };
  }
  
  async executeCodeWithInput(code, language, input) {
    if (language === 'python') {
      return await this.runPythonWithInput(code, input);
    } else if (language === 'javascript') {
      return await this.runJavaScriptWithInput(code, input);
    } else if (language === 'java') {
      return await this.runJavaWithInput(code, input);
    } else if (language === 'cpp') {
      return await this.runCppWithInput(code, input);
    } else {
      throw new Error(`Language "${language}" not supported for input execution`);
    }
  }
  
  normalizeOutput(output) {
    if (!output) return '';
    return output
      .toString()
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  async runPythonWithInput(code, input) {
    const startTime = Date.now();
    const filename = `code_${Date.now()}.py`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`Python file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      // input file create krega, works for both linux and windoe
      const inputFilename = `input_${Date.now()}.txt`;
      const inputFilepath = path.join(this.tempDir, inputFilename);
      await fs.writeFile(inputFilepath, input);
      
      let inputDockerPath = inputFilepath;
      if (process.platform === 'win32') {
        inputDockerPath = inputFilepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/code.py" -v "${inputDockerPath}:/app/input.txt" python:3.11-alpine sh -c "cat /app/input.txt | python /app/code.py"`;
      
      console.log(`Running command: ${command.substring(0, 150)}...`);
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 10000,
        shell: true,
        windowsHide: true
      });
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputFilepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  async runJavaScriptWithInput(code, input) {
    const startTime = Date.now();
    const filename = `code_${Date.now()}.js`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      console.log(`JavaScript file created: ${filepath}`);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      // input file creation
      const inputFilename = `input_${Date.now()}.txt`;
      const inputFilepath = path.join(this.tempDir, inputFilename);
      await fs.writeFile(inputFilepath, input);
      
      let inputDockerPath = inputFilepath;
      if (process.platform === 'win32') {
        inputDockerPath = inputFilepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/code.js" -v "${inputDockerPath}:/app/input.txt" node:18-alpine sh -c "cat /app/input.txt | node /app/code.js"`;
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 10000,
        shell: true,
        windowsHide: true
      });
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputFilepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async runJavaWithInput(code, input) {
    const startTime = Date.now();
    const filename = `Main_${Date.now()}.java`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      // Create input file
      const inputFilename = `input_${Date.now()}.txt`;
      const inputFilepath = path.join(this.tempDir, inputFilename);
      await fs.writeFile(inputFilepath, input);
      
      let inputDockerPath = inputFilepath;
      if (process.platform === 'win32') {
        inputDockerPath = inputFilepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/Main.java" -v "${inputDockerPath}:/app/input.txt" openjdk:17-jdk-slim sh -c "cd /app && javac Main.java && cat /app/input.txt | java Main"`;
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 15000,
        shell: true,
        windowsHide: true
      });
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputFilepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  async runCppWithInput(code, input) {
    const startTime = Date.now();
    const filename = `program_${Date.now()}.cpp`;
    const filepath = path.join(this.tempDir, filename);
    
    try {
      await fs.writeFile(filepath, code);
      
      let dockerPath = filepath;
      if (process.platform === 'win32') {
        dockerPath = filepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      // Create input file
      const inputFilename = `input_${Date.now()}.txt`;
      const inputFilepath = path.join(this.tempDir, inputFilename);
      await fs.writeFile(inputFilepath, input);
      
      let inputDockerPath = inputFilepath;
      if (process.platform === 'win32') {
        inputDockerPath = inputFilepath.replace(/^([A-Z]):\\/, '/$1/').replace(/\\/g, '/');
      }
      
      const command = `docker run --rm --memory=256m -v "${dockerPath}:/app/program.cpp" -v "${inputDockerPath}:/app/input.txt" gcc:latest sh -c "cd /app && g++ program.cpp -o program && cat /app/input.txt | ./program"`;
      
      const { stdout, stderr } = await this.runDockerCommand(command, {
        timeout: 15000,
        shell: true,
        windowsHide: true
      });
      
      // Cleanup
      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(inputFilepath).catch(() => {});
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim(),
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      await fs.unlink(filepath).catch(() => {});
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }
}

const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;