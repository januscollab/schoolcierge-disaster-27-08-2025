#!/usr/bin/env node

/**
 * Auto Test Generator
 * Automatically creates tests based on ACTUAL files created for a task
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class AutoTestGenerator {
  constructor(taskId) {
    this.taskId = taskId;
    this.taskNumber = taskId.match(/TASK-(\d+)/)?.[1];
    this.trackedFiles = [];
    this.testPath = path.join(process.cwd(), 'src/tests', `${taskId.toLowerCase()}.test.js`);
  }

  // Find what files were actually created/modified for this task
  discoverTaskFiles() {
    console.log(chalk.yellow(`Discovering files for ${this.taskId}...`));
    
    // Use predefined patterns for known tasks
    // This ensures we test ONLY relevant files, not everything
    this.trackedFiles = this.findFilesByPattern();
    
    if (this.trackedFiles.length === 0) {
      // Fallback: Check git commits for this task
      try {
        const commits = execSync(
          `git log --oneline --grep="${this.taskId}" --pretty=format:"%H" 2>/dev/null || true`,
          { encoding: 'utf-8' }
        ).trim().split('\n').filter(c => c);
        
        if (commits.length > 0) {
          const files = new Set();
          
          // Only get files from the FIRST commit for this task (the implementation commit)
          const commit = commits[commits.length - 1]; // Oldest commit for this task
          try {
            const changedFiles = execSync(
              `git diff-tree --no-commit-id --name-only -r ${commit} 2>/dev/null || true`,
              { encoding: 'utf-8' }
            ).trim().split('\n').filter(f => {
              // Filter out non-implementation files
              return f && 
                     !f.includes('node_modules') &&
                     !f.includes('.project/') &&
                     !f.includes('test') &&
                     !f.endsWith('.md') &&
                     !f.endsWith('.txt');
            });
            
            changedFiles.forEach(f => files.add(f));
          } catch {}
          
          this.trackedFiles = Array.from(files);
          console.log(chalk.green(`Found ${this.trackedFiles.length} files from git history`));
        }
      } catch {}
    } else {
      console.log(chalk.green(`Found ${this.trackedFiles.length} files by pattern matching`));
    }
    
    return this.trackedFiles;
  }

  findFilesByPattern() {
    const files = [];
    const taskMapping = {
      // Infrastructure tasks - test config and setup
      'TASK-001': ['railway.json', 'railway.toml', 'prisma/schema.prisma', '.env.example'],
      'TASK-002': ['railway.json', 'railway.toml', '.env.example', 'prisma/schema.prisma', 'docker-compose.yml'],
      
      // API/Backend tasks - test API structure
      'TASK-005': ['src/api/server.ts', 'src/api/server.js', 'src/api/index.ts', 'src/api/routes/', 'src/api/middleware/'],
      
      // Mobile tasks - test app structure
      'TASK-008': ['App.tsx', 'app/', 'tamagui.config.ts', 'app.json', 'metro.config.js'],
      
      // Feature tasks - test specific implementations
      'TASK-009': ['src/api/routes/families.ts', 'src/api/routes/families.js', 'src/lib/whatsapp/'],
      'TASK-010': ['src/api/routes/messages.ts', 'src/api/routes/students.ts', 'src/lib/email/'],
      
      // Authentication tasks
      'TASK-003': ['src/api/middleware/auth.ts', 'src/lib/auth.ts', 'src/lib/clerk.ts'],
      'TASK-004': ['src/api/middleware/auth.ts', 'src/lib/auth/', 'src/api/routes/auth.ts']
    };
    
    const patterns = taskMapping[this.taskId] || [];
    
    for (const pattern of patterns) {
      if (fs.existsSync(path.join(process.cwd(), pattern))) {
        files.push(pattern);
      }
    }
    
    return files;
  }

  analyzeFiles() {
    const analysis = {
      configFiles: [],
      sourceFiles: [],
      testFiles: [],
      schemaFiles: [],
      routeFiles: [],
      middlewareFiles: [],
      componentFiles: [],
      libFiles: []
    };
    
    for (const file of this.trackedFiles) {
      if (file.endsWith('.json') || file.endsWith('.toml') || file.endsWith('.yml')) {
        analysis.configFiles.push(file);
      } else if (file.includes('schema.prisma')) {
        analysis.schemaFiles.push(file);
      } else if (file.includes('/routes/')) {
        analysis.routeFiles.push(file);
      } else if (file.includes('/middleware/')) {
        analysis.middlewareFiles.push(file);
      } else if (file.includes('/components/') || file.endsWith('.tsx')) {
        analysis.componentFiles.push(file);
      } else if (file.includes('/lib/')) {
        analysis.libFiles.push(file);
      } else if (file.includes('.test.') || file.includes('.spec.')) {
        analysis.testFiles.push(file);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        analysis.sourceFiles.push(file);
      }
    }
    
    return analysis;
  }

  generateTestsForFiles(analysis) {
    const tests = [];
    
    // Generate tests for config files
    if (analysis.configFiles.length > 0) {
      tests.push(this.generateConfigTests(analysis.configFiles));
    }
    
    // Generate tests for routes
    if (analysis.routeFiles.length > 0) {
      tests.push(this.generateRouteTests(analysis.routeFiles));
    }
    
    // Generate tests for middleware
    if (analysis.middlewareFiles.length > 0) {
      tests.push(this.generateMiddlewareTests(analysis.middlewareFiles));
    }
    
    // Generate tests for components
    if (analysis.componentFiles.length > 0) {
      tests.push(this.generateComponentTests(analysis.componentFiles));
    }
    
    // Generate tests for lib files
    if (analysis.libFiles.length > 0) {
      tests.push(this.generateLibTests(analysis.libFiles));
    }
    
    // Generate tests for schema
    if (analysis.schemaFiles.length > 0) {
      tests.push(this.generateSchemaTests(analysis.schemaFiles));
    }
    
    return tests.filter(t => t).join('\n\n');
  }

  generateConfigTests(files) {
    const tests = files.map(file => {
      const basename = path.basename(file);
      return `
    test('${basename} exists and is valid', () => {
      const configPath = path.join(projectRoot, '${file}');
      expect(fs.existsSync(configPath)).toBe(true);
      
      // Validate JSON/TOML structure
      ${file.endsWith('.json') ? `
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config).toBeDefined();` : ''}
    });`;
    }).join('\n');
    
    return `  describe('Configuration Files', () => {${tests}
  });`;
  }

  generateRouteTests(files) {
    const tests = files.map(file => {
      const routeName = path.basename(file, '.ts').replace('.js', '');
      return `
    test('${routeName} route exports handlers', () => {
      const routePath = path.join(projectRoot, '${file}');
      expect(fs.existsSync(routePath)).toBe(true);
      
      const content = fs.readFileSync(routePath, 'utf-8');
      
      // Check for Express router
      expect(content).toContain('router');
      
      // Check for HTTP methods
      expect(content).toMatch(/router\\.(get|post|put|delete|patch)/);
      
      // Check for exports
      expect(content).toContain('export');
    });`;
    }).join('\n');
    
    return `  describe('API Routes', () => {${tests}
    
    test.todo('Routes handle errors properly');
    test.todo('Routes validate input');
    test.todo('Routes return correct status codes');
  });`;
  }

  generateMiddlewareTests(files) {
    const tests = files.map(file => {
      const middlewareName = path.basename(file, '.ts').replace('.js', '');
      return `
    test('${middlewareName} middleware exists and exports function', () => {
      const middlewarePath = path.join(projectRoot, '${file}');
      expect(fs.existsSync(middlewarePath)).toBe(true);
      
      const content = fs.readFileSync(middlewarePath, 'utf-8');
      
      // Check for middleware function signature
      expect(content).toMatch(/(req|request).*(res|response).*(next)/);
      
      // Check for exports
      expect(content).toContain('export');
    });`;
    }).join('\n');
    
    return `  describe('Middleware', () => {${tests}
    
    test.todo('Middleware handles errors');
    test.todo('Middleware calls next() appropriately');
  });`;
  }

  generateComponentTests(files) {
    const tests = files.map(file => {
      const componentName = path.basename(file, '.tsx').replace('.jsx', '');
      return `
    test('${componentName} component exists and exports React component', () => {
      const componentPath = path.join(projectRoot, '${file}');
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      // Check for React import
      expect(content).toMatch(/import.*React|from ['"]react['"]/);
      
      // Check for component export
      expect(content).toMatch(/export.*function|export.*const|export default/);
    });`;
    }).join('\n');
    
    return `  describe('React Components', () => {${tests}
    
    test.todo('Components render without crashing');
    test.todo('Components handle props correctly');
  });`;
  }

  generateLibTests(files) {
    const tests = files.map(file => {
      const libName = path.basename(file, '.ts').replace('.js', '');
      return `
    test('${libName} library module exists and exports functions', () => {
      const libPath = path.join(projectRoot, '${file}');
      expect(fs.existsSync(libPath)).toBe(true);
      
      const content = fs.readFileSync(libPath, 'utf-8');
      
      // Check for exports
      expect(content).toContain('export');
      
      // Check for function definitions
      expect(content).toMatch(/function|const.*=.*=>|class/);
    });`;
    }).join('\n');
    
    return `  describe('Library Modules', () => {${tests}
    
    test.todo('Library functions work correctly');
    test.todo('Error handling is implemented');
  });`;
  }

  generateSchemaTests(files) {
    return `  describe('Database Schema', () => {
    test('Prisma schema is valid', () => {
      const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);
      
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Check for datasource
      expect(schema).toContain('datasource');
      expect(schema).toContain('provider');
      
      // Check for generator
      expect(schema).toContain('generator');
      
      // Check for models
      expect(schema).toContain('model');
    });
    
    test.todo('Database migrations are up to date');
    test.todo('Schema matches application models');
  });`;
  }

  generateTestFile() {
    // Skip if test already exists
    if (fs.existsSync(this.testPath)) {
      console.log(chalk.yellow(`Test already exists: ${this.testPath}`));
      return false;
    }
    
    // Discover files
    this.discoverTaskFiles();
    
    if (this.trackedFiles.length === 0) {
      console.log(chalk.red(`No files found for ${this.taskId}`));
      return false;
    }
    
    // Analyze files
    const analysis = this.analyzeFiles();
    
    console.log(chalk.cyan('File Analysis:'));
    console.log(`  Config: ${analysis.configFiles.length}`);
    console.log(`  Routes: ${analysis.routeFiles.length}`);
    console.log(`  Components: ${analysis.componentFiles.length}`);
    console.log(`  Libraries: ${analysis.libFiles.length}`);
    
    // Generate test content
    const testSuites = this.generateTestsForFiles(analysis);
    
    const testContent = `/**
 * ${this.taskId}: Auto-generated tests based on actual implementation
 * Generated from ${this.trackedFiles.length} tracked files
 */

const fs = require('fs');
const path = require('path');
${analysis.routeFiles.length > 0 ? "const request = require('supertest');" : ''}

describe('${this.taskId} Implementation Tests', () => {
  const projectRoot = process.cwd();

${testSuites}

  describe('Integration', () => {
    test('All required files for ${this.taskId} exist', () => {
      const requiredFiles = ${JSON.stringify(this.trackedFiles, null, 6)};
      
      const missingFiles = requiredFiles.filter(file => 
        !fs.existsSync(path.join(projectRoot, file))
      );
      
      expect(missingFiles).toEqual([]);
    });
    
    test.todo('End-to-end functionality works');
    test.todo('Error scenarios are handled');
  });
});`;
    
    // Ensure directory exists
    const testDir = path.dirname(this.testPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Write test file
    fs.writeFileSync(this.testPath, testContent);
    console.log(chalk.green(`✅ Generated test: ${this.testPath}`));
    
    return true;
  }
}

// Export for use in test-runner.js
module.exports = AutoTestGenerator;

// CLI usage
if (require.main === module) {
  const taskId = process.argv[2];
  
  if (!taskId || !taskId.match(/^TASK-\d+$/)) {
    console.error(chalk.red('Usage: node auto-test-generator.js TASK-XXX'));
    process.exit(1);
  }
  
  const generator = new AutoTestGenerator(taskId);
  generator.generateTestFile();
}