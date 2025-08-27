const fs = require('fs');
const path = require('path');

// TASK-005: Create Express API boilerplate with TypeScript - REAL TESTS
describe('TASK-005: Express API Boilerplate', () => {
  
  describe('Project Structure', () => {
    test('should have Express app configuration file', () => {
      const appPath = path.join(process.cwd(), 'src/api/app.ts');
      expect(fs.existsSync(appPath)).toBe(true);
    });
    
    test('should have server entry point', () => {
      const serverPath = path.join(process.cwd(), 'src/api/server.ts');
      expect(fs.existsSync(serverPath)).toBe(true);
    });
    
    test('should have proper directory structure', () => {
      const directories = [
        'src/api/config',
        'src/api/middleware',
        'src/api/routes',
        'src/api/utils',
        'src/api/controllers',
        'src/api/services',
        'src/api/types'
      ];
      
      directories.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });
  
  describe('Core API Files', () => {
    test('should have app.ts with proper Express setup', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      
      // Check for essential imports
      expect(appContent).toContain("import express");
      expect(appContent).toContain("import cors from 'cors'");
      expect(appContent).toContain("import helmet from 'helmet'");
      expect(appContent).toContain("import compression from 'compression'");
      
      // Check for App class
      expect(appContent).toContain("export class App");
      expect(appContent).toContain("setupMiddleware");
      expect(appContent).toContain("setupRoutes");
      expect(appContent).toContain("setupErrorHandling");
    });
    
    test('should have security middleware configured', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      
      // Security configurations
      expect(appContent).toContain("helmet({");
      expect(appContent).toContain("contentSecurityPolicy");
      expect(appContent).toContain("crossOriginEmbedderPolicy");
      expect(appContent).toContain("rateLimit");
    });
  });
  
  describe('Middleware', () => {
    test('should have error handler middleware', () => {
      const errorHandlerPath = path.join(process.cwd(), 'src/api/middleware/error-handler.ts');
      expect(fs.existsSync(errorHandlerPath)).toBe(true);
      
      const content = fs.readFileSync(errorHandlerPath, 'utf8');
      expect(content).toContain('export');
      expect(content).toContain('ErrorRequestHandler');
    });
    
    test('should have authentication middleware', () => {
      const authPath = path.join(process.cwd(), 'src/api/middleware/auth.ts');
      expect(fs.existsSync(authPath)).toBe(true);
      
      const content = fs.readFileSync(authPath, 'utf8');
      expect(content).toContain('verifyToken');
      expect(content).toContain('RequestHandler');
    });
    
    test('should have request validator middleware', () => {
      const validatorPath = path.join(process.cwd(), 'src/api/middleware/request-validator.ts');
      expect(fs.existsSync(validatorPath)).toBe(true);
      
      const content = fs.readFileSync(validatorPath, 'utf8');
      expect(content).toContain('export');
      expect(content).toContain('requestValidator');
    });
    
    test('should have rate limiter middleware', () => {
      const rateLimiterPath = path.join(process.cwd(), 'src/api/middleware/rate-limiter.ts');
      expect(fs.existsSync(rateLimiterPath)).toBe(true);
      
      const content = fs.readFileSync(rateLimiterPath, 'utf8');
      expect(content).toContain('rateLimit');
      expect(content).toContain('windowMs');
      expect(content).toContain('max');
    });
  });
  
  describe('Routes', () => {
    test('should have health check route', () => {
      const healthPath = path.join(process.cwd(), 'src/api/routes/health.ts');
      expect(fs.existsSync(healthPath)).toBe(true);
      
      const content = fs.readFileSync(healthPath, 'utf8');
      expect(content).toContain('Router');
      expect(content).toContain('/health');
    });
    
    test('should have main API router', () => {
      const apiPath = path.join(process.cwd(), 'src/api/routes/api.ts');
      expect(fs.existsSync(apiPath)).toBe(true);
      
      const content = fs.readFileSync(apiPath, 'utf8');
      expect(content).toContain('Router');
      expect(content).toContain('export');
    });
    
    test('should have families routes', () => {
      const familiesPath = path.join(process.cwd(), 'src/api/routes/families.ts');
      expect(fs.existsSync(familiesPath)).toBe(true);
    });
    
    test('should have messages routes', () => {
      const messagesPath = path.join(process.cwd(), 'src/api/routes/messages.ts');
      expect(fs.existsSync(messagesPath)).toBe(true);
    });
  });
  
  describe('Utils', () => {
    test('should have logger utility', () => {
      const loggerPath = path.join(process.cwd(), 'src/api/utils/logger.ts');
      expect(fs.existsSync(loggerPath)).toBe(true);
      
      const content = fs.readFileSync(loggerPath, 'utf8');
      expect(content).toContain('pino');
      expect(content).toContain('export');
      expect(content).toContain('logger');
    });
    
    test('should have database utility', () => {
      const dbPath = path.join(process.cwd(), 'src/api/utils/database.ts');
      expect(fs.existsSync(dbPath)).toBe(true);
      
      const content = fs.readFileSync(dbPath, 'utf8');
      expect(content).toContain('PrismaClient');
      expect(content).toContain('export');
      expect(content).toContain('prisma');
    });
    
    test('should have security utilities', () => {
      const securityPath = path.join(process.cwd(), 'src/api/utils/security.ts');
      expect(fs.existsSync(securityPath)).toBe(true);
      
      const content = fs.readFileSync(securityPath, 'utf8');
      expect(content).toContain('export');
    });
    
    test('should have validation utilities', () => {
      const validationPath = path.join(process.cwd(), 'src/api/utils/validation.ts');
      expect(fs.existsSync(validationPath)).toBe(true);
    });
  });
  
  describe('Configuration', () => {
    test('should have main config file', () => {
      const configPath = path.join(process.cwd(), 'src/api/config/index.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('export');
      expect(content).toContain('config');
    });
    
    test('should have environment configuration', () => {
      const envPath = path.join(process.cwd(), 'src/api/config/env.ts');
      expect(fs.existsSync(envPath)).toBe(true);
      
      const content = fs.readFileSync(envPath, 'utf8');
      expect(content).toContain('process.env');
      expect(content).toContain('NODE_ENV');
    });
  });
  
  describe('TypeScript Configuration', () => {
    test('should have TypeScript config file', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
      
      const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(config.compilerOptions).toBeDefined();
      expect(config.compilerOptions.target).toBeDefined();
      expect(config.compilerOptions.module).toBeDefined();
      expect(config.compilerOptions.strict).toBe(true);
    });
  });
  
  describe('Security Features', () => {
    test('should implement CORS properly', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      expect(appContent).toContain('cors({');
      expect(appContent).toContain('credentials:');
    });
    
    test('should implement XSS protection', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      expect(appContent).toContain('xss');
    });
    
    test('should implement rate limiting', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      expect(appContent).toContain('rateLimit');
      expect(appContent).toContain('windowMs');
    });
    
    test('should implement input sanitization', () => {
      const appContent = fs.readFileSync(path.join(process.cwd(), 'src/api/app.ts'), 'utf8');
      expect(appContent).toContain('mongoSanitize');
    });
  });
});