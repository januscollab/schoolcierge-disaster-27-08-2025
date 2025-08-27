/**
 * Task Analyzer
 * Analyzes tasks to understand what was built and what needs testing
 * 
 * Uses TaskStateManager and actual file analysis to determine:
 * - What files were created/modified
 * - What type of implementation (API, UI, infrastructure)
 * - What dependencies are used
 * - What requirements need testing
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class TaskAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Analyze a task to understand its implementation
   */
  async analyzeTask(task) {
    const analysis = {
      taskId: task.id,
      category: task.category,
      files: [],
      components: [],
      routes: [],
      models: [],
      dependencies: [],
      requirements: {
        functional: [],
        performance: [],
        security: []
      },
      testableElements: []
    };

    // Get files from task implementation_notes
    if (task.implementation_notes?.files_created) {
      analysis.files = [...task.implementation_notes.files_created];
    }
    if (task.implementation_notes?.files_to_modify) {
      analysis.files.push(...task.implementation_notes.files_to_modify);
    }

    // If no files recorded, try to discover them
    if (analysis.files.length === 0) {
      analysis.files = await this.discoverTaskFiles(task.id);
    }

    // Analyze each file to understand what was built
    for (const file of analysis.files) {
      await this.analyzeFile(file, analysis);
    }

    // Extract requirements from task
    this.extractRequirements(task, analysis);

    // Identify testable elements
    this.identifyTestableElements(analysis);

    return analysis;
  }

  /**
   * Discover files created/modified for a task using git
   */
  async discoverTaskFiles(taskId) {
    const files = [];
    
    try {
      // Look for commits mentioning this task
      const commits = execSync(
        `git log --oneline --grep="${taskId}" --pretty=format:"%H" 2>/dev/null || true`,
        { encoding: 'utf-8' }
      ).trim().split('\n').filter(c => c);

      if (commits.length > 0) {
        // Get files from the most relevant commit
        const commit = commits[commits.length - 1]; // Oldest commit for this task
        
        const changedFiles = execSync(
          `git diff-tree --no-commit-id --name-only -r ${commit} 2>/dev/null || true`,
          { encoding: 'utf-8' }
        ).trim().split('\n').filter(f => {
          return f && 
                 !f.includes('node_modules') &&
                 !f.includes('.project/') &&
                 !f.includes('test') &&
                 !f.endsWith('.md');
        });
        
        files.push(...changedFiles);
      }
    } catch {}

    // Use task-specific patterns as fallback
    if (files.length === 0) {
      files.push(...this.getTaskPatternFiles(taskId));
    }

    return files;
  }

  /**
   * Get expected files based on task patterns
   */
  getTaskPatternFiles(taskId) {
    const patterns = {
      'TASK-001': ['railway.json', 'railway.toml', 'prisma/schema.prisma'],
      'TASK-002': ['railway.json', 'railway.toml', '.env.example', 'docker-compose.yml'],
      'TASK-003': ['src/api/middleware/auth.ts', 'src/lib/clerk.ts'],
      'TASK-004': ['src/lib/whatsapp-auth.ts', 'src/api/routes/auth/otp.ts'],
      'TASK-005': ['src/api/server.ts', 'src/api/app.ts', 'src/api/routes/', 'src/api/middleware/'],
      'TASK-008': ['App.tsx', 'app/', 'tamagui.config.ts', 'app.json'],
      'TASK-009': ['.github/workflows/ci.yml'],
      'TASK-010': ['src/api/routes/emails.ts', 'src/lib/mailgun.ts']
    };

    return patterns[taskId] || [];
  }

  /**
   * Analyze a single file to understand its purpose
   */
  async analyzeFile(filePath, analysis) {
    const fullPath = path.join(this.projectRoot, filePath);
    
    try {
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (!exists) return;

      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Detect API routes
      if (filePath.includes('/routes/') || content.includes('router.')) {
        const routes = this.extractRoutes(content);
        analysis.routes.push(...routes);
      }

      // Detect React components
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        const components = this.extractComponents(content);
        analysis.components.push(...components);
      }

      // Detect Prisma models
      if (filePath.includes('schema.prisma')) {
        const models = this.extractPrismaModels(content);
        analysis.models.push(...models);
      }

      // Detect middleware
      if (filePath.includes('/middleware/')) {
        analysis.testableElements.push({
          type: 'middleware',
          path: filePath,
          name: path.basename(filePath, path.extname(filePath))
        });
      }

      // Detect external dependencies
      const deps = this.extractDependencies(content);
      deps.forEach(dep => {
        if (!analysis.dependencies.includes(dep)) {
          analysis.dependencies.push(dep);
        }
      });

    } catch (error) {
      // File might not exist yet or be inaccessible
      console.warn(`Could not analyze ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extract API routes from file content
   */
  extractRoutes(content) {
    const routes = [];
    const routePattern = /router\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        hasAuth: content.includes('authenticate') || content.includes('requireAuth'),
        hasValidation: content.includes('validate') || content.includes('body(')
      });
    }

    return routes;
  }

  /**
   * Extract React component names
   */
  extractComponents(content) {
    const components = [];
    
    // Function components
    const funcPattern = /(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*[:=]/g;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      components.push({
        name: match[1],
        type: 'function',
        hasProps: content.includes(`${match[1]}:`) || content.includes(`${match[1]} = (`),
        hasState: content.includes('useState') || content.includes('useReducer')
      });
    }

    return components;
  }

  /**
   * Extract Prisma models
   */
  extractPrismaModels(content) {
    const models = [];
    const modelPattern = /model\s+(\w+)\s*{/g;
    
    let match;
    while ((match = modelPattern.exec(content)) !== null) {
      models.push({
        name: match[1],
        hasRelations: content.includes('@relation'),
        hasUnique: content.includes('@unique'),
        hasIndex: content.includes('@@index')
      });
    }

    return models;
  }

  /**
   * Extract external dependencies
   */
  extractDependencies(content) {
    const deps = [];
    const importPattern = /(?:import|require)\s*\(?\s*['"`]([^'"`./][^'"`]*?)['"`]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const dep = match[1];
      // Filter out Node built-ins and common utilities
      if (!dep.startsWith('node:') && 
          !['fs', 'path', 'util', 'crypto', 'http', 'https'].includes(dep)) {
        deps.push(dep);
      }
    }

    return [...new Set(deps)];
  }

  /**
   * Extract requirements from task definition
   */
  extractRequirements(task, analysis) {
    // Functional requirements from acceptance criteria
    if (task.product_requirements?.acceptance_criteria) {
      analysis.requirements.functional.push(...task.product_requirements.acceptance_criteria);
    }

    // Performance requirements based on category
    if (['api', 'backend', 'timer'].includes(task.category)) {
      analysis.requirements.performance.push('Response time < 200ms');
      analysis.requirements.performance.push('Handle 100 concurrent requests');
    }

    // Security requirements
    if (['authentication', 'api', 'integration'].includes(task.category)) {
      analysis.requirements.security.push('Require authentication for protected routes');
      analysis.requirements.security.push('Validate and sanitize all inputs');
      analysis.requirements.security.push('Prevent SQL injection');
      analysis.requirements.security.push('Implement rate limiting');
    }

    // Mobile specific requirements
    if (task.category === 'mobile') {
      analysis.requirements.functional.push('Works on iOS and Android');
      analysis.requirements.functional.push('Handles offline mode gracefully');
      analysis.requirements.functional.push('Responsive to different screen sizes');
    }
  }

  /**
   * Identify what needs to be tested
   */
  identifyTestableElements(analysis) {
    // API endpoints
    for (const route of analysis.routes) {
      analysis.testableElements.push({
        type: 'api',
        method: route.method,
        path: route.path,
        tests: [
          'success response',
          'error handling',
          route.hasAuth ? 'authentication required' : null,
          route.hasValidation ? 'input validation' : null,
          'SQL injection prevention',
          'rate limiting'
        ].filter(Boolean)
      });
    }

    // React components
    for (const component of analysis.components) {
      analysis.testableElements.push({
        type: 'component',
        name: component.name,
        tests: [
          'renders without crashing',
          component.hasProps ? 'handles props correctly' : null,
          component.hasState ? 'state changes correctly' : null,
          'user interaction',
          'error boundaries'
        ].filter(Boolean)
      });
    }

    // Database models
    for (const model of analysis.models) {
      analysis.testableElements.push({
        type: 'model',
        name: model.name,
        tests: [
          'CRUD operations',
          model.hasUnique ? 'unique constraints' : null,
          model.hasRelations ? 'relationship integrity' : null,
          'transaction support',
          'query performance'
        ].filter(Boolean)
      });
    }

    // External integrations
    const integrationDeps = ['mailgun', 'twilio', 'whatsapp', 'openai', 'clerk'];
    for (const dep of analysis.dependencies) {
      if (integrationDeps.some(int => dep.includes(int))) {
        analysis.testableElements.push({
          type: 'integration',
          service: dep,
          tests: [
            'connection successful',
            'handles service errors',
            'retry logic',
            'timeout handling',
            'mock for testing'
          ]
        });
      }
    }
  }
}

module.exports = TaskAnalyzer;