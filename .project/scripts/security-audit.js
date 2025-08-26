#!/usr/bin/env node

const { execSync } = require('child_process');
const gradient = require('gradient-string');
const ora = require('ora');
const Table = require('cli-table3');

// creaite branding
const creaiteGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
const aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']);
const dangerGradient = gradient(['#ef4444', '#dc2626']);
const successGradient = gradient(['#10b981', '#059669']);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class SecurityAuditor {
  constructor() {
    this.results = {
      npmAudit: null,
      eslintSecurity: null,
      sensitiveData: null,
      dependencies: null,
      passed: true
    };
  }

  displayHeader() {
    console.clear();
    console.log('\n' + creaiteGradient('━'.repeat(60)));
    console.log(
      '    ' + colors.bold + creaiteGradient('cre') + 
      aiGradient('ai') + 
      creaiteGradient('te') + 
      colors.reset + ' ' +
      colors.bold + '🔒 Security Audit' + colors.reset
    );
    console.log(creaiteGradient('━'.repeat(60)) + '\n');
  }

  async runNpmAudit() {
    const spinner = ora('Running npm audit...').start();
    
    try {
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);
      
      this.results.npmAudit = {
        vulnerabilities: audit.metadata.vulnerabilities,
        total: audit.metadata.totalDependencies
      };
      
      const total = Object.values(audit.metadata.vulnerabilities).reduce((a, b) => a + b, 0);
      
      if (total === 0) {
        spinner.succeed(colors.green + 'No vulnerabilities found in dependencies' + colors.reset);
      } else {
        spinner.warn(colors.yellow + `Found ${total} vulnerabilities` + colors.reset);
        this.results.passed = false;
        
        // Display vulnerability breakdown
        const vulnTable = new Table({
          head: ['Severity', 'Count'],
          style: { border: ['yellow'] }
        });
        
        Object.entries(audit.metadata.vulnerabilities).forEach(([severity, count]) => {
          if (count > 0) {
            vulnTable.push([severity, count]);
          }
        });
        
        console.log(vulnTable.toString());
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      try {
        const audit = JSON.parse(error.stdout);
        const total = Object.values(audit.metadata.vulnerabilities).reduce((a, b) => a + b, 0);
        
        spinner.warn(colors.yellow + `Found ${total} vulnerabilities` + colors.reset);
        this.results.passed = false;
        
        const vulnTable = new Table({
          head: ['Severity', 'Count'],
          style: { border: ['red'] }
        });
        
        Object.entries(audit.metadata.vulnerabilities).forEach(([severity, count]) => {
          if (count > 0) {
            const color = severity === 'critical' || severity === 'high' ? colors.red :
                         severity === 'moderate' ? colors.yellow : colors.gray;
            vulnTable.push([color + severity + colors.reset, count]);
          }
        });
        
        console.log(vulnTable.toString());
        console.log(colors.cyan + '\n💡 Run "npm audit fix" to fix vulnerabilities\n' + colors.reset);
      } catch {
        spinner.fail(colors.red + 'Failed to run npm audit' + colors.reset);
      }
    }
  }

  async runEslintSecurity() {
    const spinner = ora('Checking code security with ESLint...').start();
    
    try {
      execSync('npx eslint .project/scripts --ext .js --quiet', { encoding: 'utf8' });
      spinner.succeed(colors.green + 'No security issues found in code' + colors.reset);
      this.results.eslintSecurity = { issues: 0 };
    } catch (error) {
      const output = error.stdout || '';
      const issues = (output.match(/error/g) || []).length;
      const warnings = (output.match(/warning/g) || []).length;
      
      if (issues > 0) {
        spinner.fail(colors.red + `Found ${issues} security issues, ${warnings} warnings` + colors.reset);
        this.results.passed = false;
        console.log(colors.gray + 'Run "npx eslint .project/scripts" for details\n' + colors.reset);
      } else if (warnings > 0) {
        spinner.warn(colors.yellow + `Found ${warnings} security warnings` + colors.reset);
        console.log(colors.gray + 'Run "npx eslint .project/scripts" for details\n' + colors.reset);
      } else {
        spinner.succeed(colors.green + 'Code security check passed' + colors.reset);
      }
      
      this.results.eslintSecurity = { issues, warnings };
    }
  }

  async checkSensitiveData() {
    const spinner = ora('Scanning for exposed sensitive data...').start();
    
    const patterns = [
      { pattern: 'password.*=.*["\']\\w+["\']', name: 'Hardcoded passwords' },
      { pattern: 'api[_-]?key.*=.*["\']\\w+["\']', name: 'API keys' },
      { pattern: 'secret.*=.*["\']\\w+["\']', name: 'Secrets' },
      { pattern: 'token.*=.*["\']\\w+["\']', name: 'Tokens' },
      { pattern: 'private[_-]?key', name: 'Private keys' }
    ];
    
    const issues = [];
    
    try {
      patterns.forEach(({ pattern, name }) => {
        try {
          // Use grep to search for patterns
          const result = execSync(
            `grep -r -i -E "${pattern}" --include="*.js" --exclude-dir=node_modules .`,
            { encoding: 'utf8' }
          );
          
          if (result) {
            issues.push({ type: name, locations: result.split('\n').filter(l => l).length });
          }
        } catch {
          // No matches found (grep returns non-zero when no matches)
        }
      });
      
      if (issues.length === 0) {
        spinner.succeed(colors.green + 'No sensitive data exposed' + colors.reset);
        this.results.sensitiveData = { clean: true };
      } else {
        spinner.warn(colors.yellow + 'Potential sensitive data found' + colors.reset);
        this.results.passed = false;
        
        const sensitiveTable = new Table({
          head: ['Type', 'Occurrences'],
          style: { border: ['yellow'] }
        });
        
        issues.forEach(issue => {
          sensitiveTable.push([issue.type, issue.locations]);
        });
        
        console.log(sensitiveTable.toString());
        console.log(colors.cyan + '\n💡 Review and move sensitive data to environment variables\n' + colors.reset);
      }
    } catch (error) {
      spinner.fail(colors.red + 'Failed to scan for sensitive data' + colors.reset);
    }
  }

  async checkOutdatedDeps() {
    const spinner = ora('Checking for outdated dependencies...').start();
    
    try {
      const output = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(output || '{}');
      const count = Object.keys(outdated).length;
      
      if (count === 0) {
        spinner.succeed(colors.green + 'All dependencies are up to date' + colors.reset);
      } else {
        spinner.info(colors.cyan + `${count} dependencies can be updated` + colors.reset);
        console.log(colors.gray + 'Run "npm outdated" for details\n' + colors.reset);
      }
      
      this.results.dependencies = { outdated: count };
    } catch {
      // npm outdated returns non-zero exit code when outdated deps exist
      spinner.info(colors.cyan + 'Some dependencies can be updated' + colors.reset);
      console.log(colors.gray + 'Run "npm outdated" for details\n' + colors.reset);
    }
  }

  displaySummary() {
    console.log('\n' + creaiteGradient('━'.repeat(60)));
    console.log(colors.bold + '📊 Security Audit Summary' + colors.reset);
    console.log(creaiteGradient('━'.repeat(60)) + '\n');
    
    if (this.results.passed) {
      console.log(successGradient('✅ ALL SECURITY CHECKS PASSED!'));
      console.log('\n' + colors.green + 'Your project is secure and ready for deployment.' + colors.reset);
    } else {
      console.log(dangerGradient('⚠️  SECURITY ISSUES DETECTED'));
      console.log('\n' + colors.yellow + 'Please address the security issues before deployment.' + colors.reset);
      
      console.log('\n' + colors.bold + 'Recommended actions:' + colors.reset);
      console.log('  1. Run ' + colors.cyan + 'npm audit fix' + colors.reset + ' to fix npm vulnerabilities');
      console.log('  2. Run ' + colors.cyan + 'npx eslint .project/scripts --fix' + colors.reset + ' to fix code issues');
      console.log('  3. Move sensitive data to environment variables');
      console.log('  4. Update outdated dependencies with ' + colors.cyan + 'npm update' + colors.reset);
    }
    
    // AI-powered suggestion
    console.log('\n' + aiGradient('🤖 ai Security Tip:'));
    console.log(colors.gray + this.getAITip() + colors.reset);
    
    console.log('\n' + creaiteGradient('━'.repeat(60)) + '\n');
  }

  getAITip() {
    const tips = [
      'Enable 2FA on all developer accounts and use strong, unique passwords.',
      'Regularly rotate API keys and use environment-specific credentials.',
      'Implement rate limiting on all API endpoints to prevent abuse.',
      'Use HTTPS everywhere and validate SSL certificates.',
      'Keep dependencies updated and review security advisories weekly.',
      'Implement proper input validation and sanitization.',
      'Use prepared statements for all database queries.',
      'Enable security headers like CSP, HSTS, and X-Frame-Options.'
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  async run() {
    this.displayHeader();
    
    // Run all security checks
    await this.runNpmAudit();
    await this.runEslintSecurity();
    await this.checkSensitiveData();
    await this.checkOutdatedDeps();
    
    // Display summary
    this.displaySummary();
    
    // Exit with appropriate code
    process.exit(this.results.passed ? 0 : 1);
  }
}

// Run security audit
const auditor = new SecurityAuditor();
auditor.run().catch(err => {
  console.error(colors.red + 'Security audit failed:' + colors.reset, err.message);
  process.exit(1);
});