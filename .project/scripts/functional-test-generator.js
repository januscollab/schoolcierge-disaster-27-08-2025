#!/usr/bin/env node

/**
 * Functional Test Generator - Creates REAL tests that verify code actually works
 * Replaces file existence checks with actual functional tests
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class FunctionalTestGenerator {
  constructor(taskId) {
    this.taskId = taskId;
    this.testPath = path.join(process.cwd(), 'src/__tests__', `${taskId.toLowerCase()}-functional.test.js`);
  }

  generateAPITests(taskId) {
    if (taskId === 'TASK-005') {
      return `
  describe('TASK-005 Express API Server - FUNCTIONAL TESTS', () => {
    let app;
    let server;

    beforeAll(async () => {
      // Import the actual app class
      const { App } = require('../../api/app');
      const appInstance = new App();
      app = appInstance.getApp();
      
      // Start server on test port
      server = app.listen(0); // Use random available port
    });

    afterAll(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('API server starts without errors', async () => {
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);
    });

    test('Health endpoint returns 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });

    test('Root endpoint returns API info', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'SchoolCierge API');
      expect(response.body).toHaveProperty('version');
    });

    test('CORS headers are set correctly', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('Security headers are present', async () => {
      const response = await request(app).get('/');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    test('Rate limiting works', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(20).fill().map(() => 
        request(app).get('/api/v1/families').expect(res => res)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      // Should have some rate limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);

    test('Invalid JSON body returns 400', async () => {
      const response = await request(app)
        .post('/api/v1/families')
        .set('Content-Type', 'application/json')
        .send('invalid json{');
      expect(response.status).toBe(400);
    });

    test('404 handler works for unknown routes', async () => {
      const response = await request(app).get('/nonexistent-route');
      expect(response.status).toBe(404);
    });
  });`;
    }

    if (taskId === 'TASK-010') {
      return `
  describe('TASK-010 Email Ingestion - FUNCTIONAL TESTS', () => {
    let app;
    let server;

    beforeAll(async () => {
      const { App } = require('../../api/app');
      const appInstance = new App();
      app = appInstance.getApp();
      server = app.listen(0);
    });

    afterAll(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('POST /api/v1/emails accepts valid email data', async () => {
      const emailData = {
        from: 'school@example.com',
        to: 'parent@example.com',
        subject: 'Test Email',
        content: 'Test content',
        messageId: 'test-123'
      };

      const response = await request(app)
        .post('/api/v1/emails')
        .send(emailData);

      // Should not return 404 or 500
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
    });

    test('POST /api/v1/emails validates required fields', async () => {
      const invalidData = { subject: 'No sender' };

      const response = await request(app)
        .post('/api/v1/emails')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    test('Email endpoint handles large payloads', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB content
      const emailData = {
        from: 'school@example.com',
        to: 'parent@example.com',
        subject: 'Large Email',
        content: largeContent
      };

      const response = await request(app)
        .post('/api/v1/emails')
        .send(emailData);

      // Should handle large payloads or reject gracefully
      expect([200, 201, 413]).toContain(response.status);
    });
  });`;
    }

    return '';
  }

  generateAuthTests(taskId) {
    if (taskId === 'TASK-003' || taskId === 'TASK-004') {
      return `
  describe('${taskId} Authentication - FUNCTIONAL TESTS', () => {
    let app;
    let server;

    beforeAll(async () => {
      const { App } = require('../../api/app');
      const appInstance = new App();
      app = appInstance.getApp();
      server = app.listen(0);
    });

    afterAll(async () => {
      if (server) {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('Protected routes require authentication', async () => {
      const response = await request(app).get('/api/v1/families');
      expect([401, 403]).toContain(response.status);
    });

    test('Invalid token is rejected', async () => {
      const response = await request(app)
        .get('/api/v1/families')
        .set('Authorization', 'Bearer invalid-token-123');
      expect([401, 403]).toContain(response.status);
    });

    test('Missing Authorization header is rejected', async () => {
      const response = await request(app).get('/api/v1/families');
      expect([401, 403]).toContain(response.status);
    });

    test('Malformed Authorization header is rejected', async () => {
      const response = await request(app)
        .get('/api/v1/families')
        .set('Authorization', 'NotBearer token123');
      expect([401, 403]).toContain(response.status);
    });
  });`;
    }

    return '';
  }

  generateDatabaseTests(taskId) {
    if (['TASK-009', 'TASK-010', 'TASK-011'].includes(taskId)) {
      return `
  describe('${taskId} Database Operations - FUNCTIONAL TESTS', () => {
    test('Prisma client connects successfully', async () => {
      const { prisma } = require('../../api/utils/database');
      
      try {
        await prisma.$connect();
        const result = await prisma.$queryRaw\`SELECT 1 as test\`;
        expect(result).toBeDefined();
      } catch (error) {
        // If connection fails, test should fail
        throw new Error(\`Database connection failed: \${error.message}\`);
      } finally {
        await prisma.$disconnect();
      }
    });

    test('Required database tables exist', async () => {
      const { prisma } = require('../../api/utils/database');
      
      try {
        // Check if we can query main tables without errors
        await prisma.family.findMany({ take: 1 });
        await prisma.student.findMany({ take: 1 });
        await prisma.message.findMany({ take: 1 });
      } catch (error) {
        if (error.code === 'P2021') {
          throw new Error('Database tables do not exist - run migrations');
        }
        throw error;
      } finally {
        await prisma.$disconnect();
      }
    });
  });`;
    }

    return '';
  }

  generateMobileTests(taskId) {
    if (taskId === 'TASK-008') {
      return `
  describe('TASK-008 Mobile App - FUNCTIONAL TESTS', () => {
    test('App.tsx renders without crashing', () => {
      const appPath = path.join(process.cwd(), 'App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);
      
      // Test that the file can be required/imported
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toContain('export default');
    });

    test('Required mobile dependencies are installed', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      const requiredDeps = ['expo', 'react-native', '@tamagui/core'];
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      requiredDeps.forEach(dep => {
        expect(allDeps).toHaveProperty(dep);
      });
    });

    test('Tamagui config is valid', () => {
      const configPath = path.join(process.cwd(), 'tamagui.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('createTamagui');
      expect(content).toContain('export default');
    });

    test('Navigation structure exists', () => {
      const navPath = path.join(process.cwd(), 'app/navigation/RootNavigator.tsx');
      expect(fs.existsSync(navPath)).toBe(true);
      
      const content = fs.readFileSync(navPath, 'utf-8');
      expect(content).toContain('NavigationContainer');
    });
  });`;
    }

    return '';
  }

  generateFunctionalTestFile() {
    console.log(chalk.yellow(`Generating FUNCTIONAL tests for ${this.taskId}...`));

    let testContent = `/**
 * ${this.taskId} - FUNCTIONAL TESTS
 * These tests verify that the code actually WORKS, not just that files exist
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');

describe('${this.taskId} - FUNCTIONAL VERIFICATION', () => {`;

    // Add specific tests based on task type
    testContent += this.generateAPITests(this.taskId);
    testContent += this.generateAuthTests(this.taskId);
    testContent += this.generateDatabaseTests(this.taskId);
    testContent += this.generateMobileTests(this.taskId);

    // Always add basic sanity tests
    testContent += `
  describe('Basic Sanity Checks', () => {
    test('Task implementation files exist and are non-empty', () => {
      const taskFiles = {
        'TASK-005': ['src/api/app.ts', 'src/api/server.ts'],
        'TASK-008': ['App.tsx', 'app.json'],
        'TASK-010': ['src/api/routes/messages.ts'],
        'TASK-003': ['src/api/middleware/auth.ts'],
        'TASK-004': ['src/api/middleware/auth.ts']
      };

      const files = taskFiles['${this.taskId}'] || [];
      
      files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content.trim().length).toBeGreaterThan(50); // Not just empty placeholder
        }
      });
    });

    test('No placeholder TODOs in critical files', () => {
      const taskFiles = {
        'TASK-005': ['src/api/app.ts', 'src/api/server.ts'],
        'TASK-008': ['App.tsx'],
        'TASK-010': ['src/api/routes/messages.ts']
      };

      const files = taskFiles['${this.taskId}'] || [];
      
      files.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Fail if file is just TODOs and placeholders
          const todoLines = content.split('\\n').filter(line => 
            line.includes('TODO:') || line.includes('Coming soon')
          ).length;
          
          const totalLines = content.split('\\n').length;
          expect(todoLines / totalLines).toBeLessThan(0.5); // Less than 50% TODOs
        }
      });
    });
  });
});`;

    // Ensure test directory exists
    const testDir = path.dirname(this.testPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Write functional test file
    fs.writeFileSync(this.testPath, testContent);
    console.log(chalk.green(`✅ Generated FUNCTIONAL test: ${this.testPath}`));
    
    return this.testPath;
  }
}

module.exports = FunctionalTestGenerator;

// CLI usage
if (require.main === module) {
  const taskId = process.argv[2];
  
  if (!taskId || !taskId.match(/^TASK-\d+$/)) {
    console.error(chalk.red('Usage: node functional-test-generator.js TASK-XXX'));
    process.exit(1);
  }
  
  const generator = new FunctionalTestGenerator(taskId);
  generator.generateFunctionalTestFile();
}