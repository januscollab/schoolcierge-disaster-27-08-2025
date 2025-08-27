const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// TASK-009: Configure GitHub CI/CD pipeline - REAL TESTS
describe('TASK-009: GitHub CI/CD Pipeline Configuration', () => {
  let workflow;
  const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');
  
  beforeAll(() => {
    // Load and parse the actual CI workflow file
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    workflow = yaml.load(workflowContent);
  });
  
  describe('Workflow File Structure', () => {
    test('should have a valid workflow file at .github/workflows/ci.yml', () => {
      expect(fs.existsSync(workflowPath)).toBe(true);
    });
    
    test('should have a valid YAML structure', () => {
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('CI Pipeline');
    });
    
    test('should define proper trigger events', () => {
      expect(workflow.on).toBeDefined();
      expect(workflow.on.push.branches).toContain('main');
      expect(workflow.on.pull_request.branches).toContain('main');
    });
  });
  
  describe('Test Job Configuration', () => {
    test('should have a test job defined', () => {
      expect(workflow.jobs.test).toBeDefined();
      expect(workflow.jobs.test.name).toBe('Run Tests');
    });
    
    test('should use matrix strategy for multiple Node versions', () => {
      const testJob = workflow.jobs.test;
      expect(testJob.strategy.matrix['node-version']).toBeDefined();
      expect(testJob.strategy.matrix['node-version']).toContain('18.x');
      expect(testJob.strategy.matrix['node-version']).toContain('20.x');
    });
    
    test('should have correct test job steps', () => {
      const steps = workflow.jobs.test.steps;
      const stepNames = steps.map(s => s.name || s.uses);
      
      expect(stepNames).toContain('actions/checkout@v3');
      expect(stepNames).toContain('Install dependencies');
      expect(stepNames).toContain('Run linter');
      expect(stepNames).toContain('Run tests');
      expect(stepNames).toContain('Upload coverage');
    });
    
    test('should run npm commands in correct order', () => {
      const steps = workflow.jobs.test.steps;
      const npmCommands = steps
        .filter(s => s.run && s.run.startsWith('npm'))
        .map(s => s.run);
      
      expect(npmCommands[0]).toBe('npm ci');
      expect(npmCommands).toContain('npm run lint');
      expect(npmCommands).toContain('npm test');
    });
  });
  
  describe('Security Job Configuration', () => {
    test('should have security scanning job', () => {
      expect(workflow.jobs.security).toBeDefined();
      expect(workflow.jobs.security.name).toBe('Security Scan');
    });
    
    test('should include security audit steps', () => {
      const steps = workflow.jobs.security.steps;
      const runCommands = steps
        .filter(s => s.run)
        .map(s => s.run);
      
      expect(runCommands).toContain('npm run security:audit');
      expect(runCommands).toContain('npm audit --audit-level=high');
    });
    
    test('should use Semgrep for SAST scanning', () => {
      const steps = workflow.jobs.security.steps;
      const semgrepStep = steps.find(s => s.uses && s.uses.includes('semgrep-action'));
      
      expect(semgrepStep).toBeDefined();
      expect(semgrepStep.with.config).toContain('p/security-audit');
      expect(semgrepStep.with.config).toContain('p/nodejs');
    });
  });
  
  describe('Code Quality Job Configuration', () => {
    test('should have code quality job', () => {
      expect(workflow.jobs['code-quality']).toBeDefined();
      expect(workflow.jobs['code-quality'].name).toBe('Code Quality');
    });
    
    test('should check code formatting and linting', () => {
      const steps = workflow.jobs['code-quality'].steps;
      const runCommands = steps
        .filter(s => s.run)
        .map(s => s.run);
      
      expect(runCommands).toContain('npm run format:check --if-present');
      expect(runCommands).toContain('npm run lint');
    });
    
    test('should analyze code complexity', () => {
      const steps = workflow.jobs['code-quality'].steps;
      const complexityStep = steps.find(s => 
        s.run && s.run.includes('complexity-report')
      );
      
      expect(complexityStep).toBeDefined();
      expect(complexityStep.run).toContain('.project/scripts');
      expect(complexityStep['continue-on-error']).toBe(true);
    });
  });
  
  describe('Best Practices', () => {
    test('should use caching for npm dependencies', () => {
      const testJob = workflow.jobs.test;
      const setupNodeStep = testJob.steps.find(s => 
        s.uses && s.uses.includes('actions/setup-node')
      );
      
      expect(setupNodeStep.with.cache).toBe('npm');
    });
    
    test('should use continue-on-error for non-critical steps', () => {
      const securitySteps = workflow.jobs.security.steps;
      const auditStep = securitySteps.find(s => 
        s.run && s.run.includes('security:audit')
      );
      
      expect(auditStep['continue-on-error']).toBe(true);
    });
    
    test('should upload test coverage to Codecov', () => {
      const testSteps = workflow.jobs.test.steps;
      const codecovStep = testSteps.find(s => 
        s.uses && s.uses.includes('codecov-action')
      );
      
      expect(codecovStep).toBeDefined();
      expect(codecovStep.with.directory).toBe('./coverage');
    });
  });
});