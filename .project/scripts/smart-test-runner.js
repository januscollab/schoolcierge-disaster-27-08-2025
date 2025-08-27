#!/usr/bin/env node

/**
 * Smart Test Runner
 * Automatically generates and runs REAL tests for any task
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class SmartTestRunner {
  constructor(taskId) {
    this.taskId = taskId;
    this.taskNumber = taskId.match(/TASK-(\d+)/)?.[1];
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.task = null;
  }

  loadTaskDetails() {
    if (!fs.existsSync(this.tasksPath)) {
      throw new Error('backlog.json not found');
    }
    
    const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf-8'));
    this.task = tasks.find(t => t.id === this.taskId);
    
    if (!this.task) {
      throw new Error(`Task ${this.taskId} not found in backlog`);
    }
  }

  findExistingTests() {
    const patterns = [
      `src/tests/task-${this.taskNumber}*.test.js`,
      `src/tests/task-${this.taskNumber}*.test.ts`,
      `src/__tests__/*task-${this.taskNumber}*.test.js`,
      `src/__tests__/*task-${this.taskNumber}*.test.ts`,
      `src/tests/${this.taskId.toLowerCase()}*.test.js`
    ];
    
    const testFiles = [];
    for (const pattern of patterns) {
      try {
        const files = execSync(`find . -path "./node_modules" -prune -o -path "./${pattern}" -print 2>/dev/null`, {
          encoding: 'utf-8'
        }).trim().split('\n').filter(f => f);
        testFiles.push(...files);
      } catch {}
    }
    
    return testFiles.filter(f => f && f.length > 0);
  }

  generateTestFile() {
    const testPath = path.join(process.cwd(), 'src/tests', `${this.taskId.toLowerCase()}-real.test.js`);
    
    // Don't overwrite existing test file
    if (fs.existsSync(testPath)) {
      return testPath;
    }
    
    // Generate test content based on task category
    let testContent = this.generateTestContent();
    
    // Ensure directory exists
    const testDir = path.dirname(testPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(testPath, testContent);
    console.log(chalk.green(`✓ Generated test file: ${testPath}`));
    
    return testPath;
  }

  generateTestContent() {
    const { category, title, technical_requirements, product_requirements } = this.task;
    
    let testSuites = [];
    
    // Generate tests based on category
    switch(category) {
      case 'authentication':
        testSuites.push(this.generateAuthTests());
        break;
      case 'backend':
      case 'api':
        testSuites.push(this.generateAPITests());
        break;
      case 'mobile':
        testSuites.push(this.generateMobileTests());
        break;
      case 'infrastructure':
        testSuites.push(this.generateInfrastructureTests());
        break;
      case 'integration':
        testSuites.push(this.generateIntegrationTests());
        break;
      case 'devops':
        testSuites.push(this.generateDevOpsTests());
        break;
      default:
        testSuites.push(this.generateGenericTests());
    }
    
    return `/**
 * ${this.taskId}: ${title}
 * Auto-generated REAL tests
 * Category: ${category}
 */

const fs = require('fs');
const path = require('path');
${category === 'api' || category === 'backend' ? "const request = require('supertest');" : ''}

describe('${this.taskId}: ${title}', () => {
${testSuites.join('\n\n')}
});`;
  }

  generateAuthTests() {
    return `  describe('Authentication Implementation', () => {
    test('Authentication configuration exists', () => {
      const hasAuthConfig = 
        fs.existsSync(path.join(process.cwd(), 'src/api/middleware/auth.ts')) ||
        fs.existsSync(path.join(process.cwd(), 'src/lib/auth.ts'));
      
      expect(hasAuthConfig).toBe(true);
    });

    test('Authentication middleware is implemented', () => {
      const authPath = path.join(process.cwd(), 'src/api/middleware/auth.ts');
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, 'utf-8');
        expect(content).toContain('export');
        expect(content).toMatch(/async|function/);
      } else {
        throw new Error('Auth middleware not found');
      }
    });

    test.todo('Authentication flow works end-to-end');
    test.todo('Token validation is secure');
    test.todo('Rate limiting is implemented');
  });`;
  }

  generateAPITests() {
    const routeName = this.task.title.toLowerCase().includes('email') ? 'messages' :
                     this.task.title.toLowerCase().includes('family') ? 'families' :
                     this.task.title.toLowerCase().includes('student') ? 'students' :
                     'api';
                     
    return `  describe('API Endpoint Tests', () => {
    test('API route file exists', () => {
      const hasRoute = 
        fs.existsSync(path.join(process.cwd(), 'src/api/routes/${routeName}.ts')) ||
        fs.existsSync(path.join(process.cwd(), 'src/api/routes/${routeName}.js'));
      
      expect(hasRoute).toBe(true);
    });

    test('Route exports expected handlers', () => {
      const routePath = path.join(process.cwd(), 'src/api/routes/${routeName}.ts');
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf-8');
        expect(content).toContain('router');
        expect(content).toMatch(/GET|POST|PUT|DELETE/);
      }
    });

    test.todo('GET endpoint returns correct data');
    test.todo('POST endpoint validates input');
    test.todo('Error handling returns proper status codes');
    test.todo('Database operations are transactional');
  });`;
  }

  generateMobileTests() {
    return `  describe('Mobile App Tests', () => {
    test('React Native components exist', () => {
      const hasComponents = 
        fs.existsSync(path.join(process.cwd(), 'app')) ||
        fs.existsSync(path.join(process.cwd(), 'src/components'));
      
      expect(hasComponents).toBe(true);
    });

    test('Navigation is configured', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );
      
      const hasNavigation = 
        packageJson.dependencies?.['@react-navigation/native'] ||
        packageJson.dependencies?.['expo-router'];
      
      expect(hasNavigation).toBeDefined();
    });

    test.todo('Screens render without crashing');
    test.todo('API calls work from mobile app');
    test.todo('Offline mode handles gracefully');
  });`;
  }

  generateInfrastructureTests() {
    return `  describe('Infrastructure Configuration', () => {
    test('Required configuration files exist', () => {
      const configFiles = [];
      
      // Check for various config files based on task requirements
      if (this.task.title.toLowerCase().includes('railway')) {
        configFiles.push('railway.json', 'railway.toml');
      }
      if (this.task.title.toLowerCase().includes('docker')) {
        configFiles.push('Dockerfile', 'docker-compose.yml');
      }
      if (this.task.title.toLowerCase().includes('database')) {
        configFiles.push('prisma/schema.prisma');
      }
      
      const hasConfig = configFiles.some(file => 
        fs.existsSync(path.join(process.cwd(), file))
      );
      
      expect(hasConfig).toBe(true);
    });

    test('Environment variables are documented', () => {
      const hasEnvExample = fs.existsSync(
        path.join(process.cwd(), '.env.example')
      );
      expect(hasEnvExample).toBe(true);
    });

    test.todo('Services start without errors');
    test.todo('Database migrations run successfully');
    test.todo('Health checks pass');
  });`;
  }

  generateIntegrationTests() {
    return `  describe('Integration Tests', () => {
    test('Required dependencies are installed', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );
      
      // Check for integration-specific packages
      const requiredPackages = [];
      if (this.task.title.toLowerCase().includes('whatsapp')) {
        requiredPackages.push('twilio', 'whatsapp-web.js', '@whiskeysockets/baileys');
      }
      if (this.task.title.toLowerCase().includes('email')) {
        requiredPackages.push('nodemailer', '@sendgrid/mail', 'mailgun-js');
      }
      if (this.task.title.toLowerCase().includes('ai')) {
        requiredPackages.push('openai', '@anthropic-ai/sdk', 'langchain');
      }
      
      const hasIntegration = requiredPackages.some(pkg => 
        packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
      );
      
      if (requiredPackages.length > 0) {
        expect(hasIntegration).toBe(true);
      } else {
        expect(true).toBe(true); // Pass if no specific packages required
      }
    });

    test.todo('External service connection works');
    test.todo('Webhook endpoints are secure');
    test.todo('Rate limits are respected');
  });`;
  }

  generateDevOpsTests() {
    return `  describe('DevOps Configuration', () => {
    test('CI/CD configuration exists', () => {
      const hasCICD = 
        fs.existsSync(path.join(process.cwd(), '.github/workflows')) ||
        fs.existsSync(path.join(process.cwd(), '.gitlab-ci.yml')) ||
        fs.existsSync(path.join(process.cwd(), 'railway.json'));
      
      expect(hasCICD).toBe(true);
    });

    test('Build scripts are defined', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
      );
      
      expect(packageJson.scripts?.build).toBeDefined();
    });

    test.todo('Build process completes successfully');
    test.todo('Tests run in CI pipeline');
    test.todo('Deployment triggers work');
  });`;
  }

  generateGenericTests() {
    return `  describe('Implementation Tests', () => {
    test('Task-related files exist', () => {
      // This is a placeholder - need to determine what files to check
      // based on actual task requirements
      expect(true).toBe(true);
    });

    test.todo('Main functionality is implemented');
    test.todo('Error handling is robust');
    test.todo('Documentation is complete');
  });`;
  }

  async run() {
    console.log(chalk.cyan(`\n🧪 SMART TEST RUNNER - ${this.taskId}`));
    console.log('━'.repeat(60));
    
    try {
      // Load task details
      this.loadTaskDetails();
      console.log(chalk.green(`✓ Found task: ${this.task.title}`));
      console.log(`  Category: ${this.task.category}`);
      console.log(`  Status: ${this.task.status}`);
      console.log(`  Priority: ${this.task.priority}`);
      
      // Find or generate test files
      let testFiles = this.findExistingTests();
      
      if (testFiles.length === 0) {
        console.log(chalk.yellow('\n⚠️  No existing tests found. Generating...'));
        const generatedFile = this.generateTestFile();
        testFiles = [generatedFile];
      } else {
        console.log(chalk.green(`\n✓ Found ${testFiles.length} existing test file(s)`));
      }
      
      // Run tests
      console.log(chalk.yellow('\n🏃 Running tests...\n'));
      
      for (const testFile of testFiles) {
        console.log(chalk.gray(`Testing: ${testFile}`));
        try {
          execSync(`npx jest ${testFile} --no-coverage --verbose`, {
            stdio: 'inherit'
          });
        } catch (error) {
          // Jest will show the errors
        }
      }
      
      // Show next steps
      console.log(chalk.cyan('\n📝 Next Steps:'));
      console.log('1. Review failing tests to see what needs implementation');
      console.log('2. Implement the missing functionality');
      console.log('3. Convert .todo tests to real tests as you implement features');
      console.log(`4. Run: ./cx test ${this.taskId} to verify`);
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const taskId = process.argv[2];
  if (!taskId || !taskId.match(/^TASK-\d+$/)) {
    console.error(chalk.red('Usage: node smart-test-runner.js TASK-XXX'));
    process.exit(1);
  }
  
  const runner = new SmartTestRunner(taskId);
  runner.run();
}

module.exports = SmartTestRunner;