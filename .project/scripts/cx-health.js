#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const Table = require('cli-table3');
const TaskHealthMonitor = require('./task-health-monitor');
const TaskHealthScorer = require('./health-scorer');
const AutoRemediationEngine = require('./auto-remediation');
const fs = require('fs');
const path = require('path');

class IntegratedHealthSystem {
  constructor() {
    this.monitor = new TaskHealthMonitor();
    this.scorer = new TaskHealthScorer();
    this.remediation = new AutoRemediationEngine();
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
  }

  loadTasks() {
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  async run(options = {}) {
    console.clear();
    this.displayHeader();
    
    const spinner = ora('Analyzing task health...').start();
    
    try {
      // Load all tasks
      const tasks = this.loadTasks();
      
      // Analyze health for all active tasks
      const healthReports = [];
      for (const task of tasks) {
        if (task.status === 'not-started' && task.progress === 0) continue;
        
        const health = this.scorer.calculateHealthScore(task);
        const issues = this.monitor.detectHealthIssues(task);
        
        healthReports.push({
          task,
          health,
          issues
        });
      }
      
      spinner.succeed('Health analysis complete');
      
      // Display dashboard
      this.displayDashboard(healthReports);
      
      // Auto-remediate if requested
      if (options.autoFix || options.fix) {
        await this.performAutoRemediation(healthReports);
      }
      
      // Show recommendations
      if (!options.quiet) {
        this.displayRecommendations(healthReports);
      }
      
      // Return for programmatic use
      return {
        reports: healthReports,
        summary: this.generateSummary(healthReports)
      };
      
    } catch (error) {
      spinner.fail(`Health check failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  displayHeader() {
    console.log(boxen(
      chalk.bold.cyan('🏥 Task Health Monitoring System') + '\n' +
      chalk.gray('Intelligent detection and auto-healing'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'center'
      }
    ));
  }

  displayDashboard(reports) {
    // Summary stats
    const summary = this.generateSummary(reports);
    
    console.log('\n' + chalk.bold('📊 Health Summary'));
    console.log(chalk.green(`  ✅ Healthy: ${summary.healthy} tasks (${summary.healthyPercent}%)`));
    console.log(chalk.yellow(`  ⚠️  Warning: ${summary.warning} tasks`));
    console.log(chalk.red(`  🚨 Critical: ${summary.critical} tasks`));
    console.log(chalk.cyan(`  📈 Average Health: ${summary.averageHealth}%`));
    
    // Detailed table
    if (reports.length > 0) {
      const table = new Table({
        head: [
          chalk.cyan('Task'),
          chalk.cyan('Status'),
          chalk.cyan('Progress'),
          chalk.cyan('Health'),
          chalk.cyan('Issues'),
          chalk.cyan('Action')
        ],
        style: {
          head: [],
          border: ['gray']
        }
      });
      
      reports
        .sort((a, b) => a.health.overall - b.health.overall)
        .slice(0, 10) // Show top 10 problematic tasks
        .forEach(report => {
          const healthColor = this.getHealthColor(report.health.overall);
          const issueCount = report.issues.length;
          
          table.push([
            report.task.id,
            this.getStatusBadge(report.task.status),
            this.generateProgressBar(report.task.progress, 10),
            healthColor(`${report.health.overall}%`),
            issueCount > 0 ? chalk.red(issueCount) : chalk.green('0'),
            this.getRecommendedAction(report)
          ]);
        });
      
      console.log('\n' + table.toString());
    }
    
    // Health breakdown
    console.log('\n' + chalk.bold('🔍 Health Factor Analysis'));
    const avgBreakdown = this.calculateAverageBreakdown(reports);
    
    const breakdownTable = new Table({
      head: [
        chalk.cyan('Factor'),
        chalk.cyan('Avg Score'),
        chalk.cyan('Weight'),
        chalk.cyan('Impact')
      ],
      style: {
        head: [],
        border: ['gray']
      }
    });
    
    Object.entries(avgBreakdown).forEach(([factor, score]) => {
      const weight = this.scorer.weights[factor] || 0;
      const impact = Math.round(score * weight);
      const color = this.getHealthColor(score);
      
      breakdownTable.push([
        this.formatFactorName(factor),
        color(`${Math.round(score)}%`),
        `${Math.round(weight * 100)}%`,
        this.generateProgressBar(impact, 10)
      ]);
    });
    
    console.log(breakdownTable.toString());
  }

  async performAutoRemediation(reports) {
    console.log('\n' + chalk.bold.yellow('🔧 Auto-Remediation'));
    
    const criticalReports = reports.filter(r => r.health.overall < 60);
    
    if (criticalReports.length === 0) {
      console.log(chalk.green('  ✅ No critical issues to auto-fix'));
      return;
    }
    
    const spinner = ora(`Applying auto-fixes to ${criticalReports.length} tasks...`).start();
    
    let fixCount = 0;
    let successCount = 0;
    
    for (const report of criticalReports) {
      const result = await this.remediation.remediate(report.task, report.issues);
      if (result.success) {
        successCount++;
        fixCount += result.applied.length;
        
        // Log specific fixes
        for (const fix of result.applied) {
          console.log(chalk.green(`  ✅ ${report.task.id}: ${fix.action}`));
        }
      }
    }
    
    if (fixCount > 0) {
      spinner.succeed(`Applied ${fixCount} fixes to ${successCount} tasks`);
    } else {
      spinner.info('No automatic fixes could be applied');
    }
  }

  displayRecommendations(reports) {
    const recommendations = [];
    
    reports.forEach(report => {
      if (report.health.recommendations?.length > 0) {
        recommendations.push({
          task: report.task.id,
          items: report.health.recommendations
        });
      }
    });
    
    if (recommendations.length > 0) {
      console.log('\n' + chalk.bold.cyan('💡 Recommendations'));
      
      recommendations.slice(0, 5).forEach(rec => {
        console.log('\n' + chalk.yellow(`  ${rec.task}:`));
        rec.items.forEach(item => {
          const icon = {
            critical: '🚨',
            high: '⚠️',
            medium: '📝',
            low: '💭'
          }[item.priority] || '•';
          
          console.log(`    ${icon} ${item.message}`);
          console.log(chalk.gray(`       → ${item.action}`));
        });
      });
      
      if (recommendations.length > 5) {
        console.log(chalk.gray(`\n  ... and ${recommendations.length - 5} more tasks with recommendations`));
      }
    }
  }

  calculateAverageBreakdown(reports) {
    const breakdown = {
      progressVelocity: 0,
      implementation: 0,
      dependencies: 0,
      timeEfficiency: 0,
      blockageRisk: 0,
      communication: 0,
      quality: 0
    };
    
    if (reports.length === 0) return breakdown;
    
    reports.forEach(report => {
      Object.keys(breakdown).forEach(factor => {
        breakdown[factor] += report.health.breakdown[factor] || 0;
      });
    });
    
    Object.keys(breakdown).forEach(factor => {
      breakdown[factor] = breakdown[factor] / reports.length;
    });
    
    return breakdown;
  }

  formatFactorName(factor) {
    const names = {
      progressVelocity: '⚡ Progress Velocity',
      implementation: '💻 Implementation',
      dependencies: '🔗 Dependencies',
      timeEfficiency: '⏰ Time Efficiency',
      blockageRisk: '🚫 Blockage Risk',
      communication: '💬 Communication',
      quality: '✨ Quality'
    };
    return names[factor] || factor;
  }

  generateSummary(reports) {
    const total = reports.length;
    const healthy = reports.filter(r => r.health.overall >= 80).length;
    const warning = reports.filter(r => r.health.overall >= 60 && r.health.overall < 80).length;
    const critical = reports.filter(r => r.health.overall < 60).length;
    
    return {
      total,
      healthy,
      warning,
      critical,
      healthyPercent: total > 0 ? Math.round((healthy / total) * 100) : 100,
      averageHealth: total > 0 ? 
        Math.round(reports.reduce((sum, r) => sum + r.health.overall, 0) / total) : 100
    };
  }

  getHealthColor(score) {
    if (score >= 80) return chalk.green;
    if (score >= 60) return chalk.yellow;
    if (score >= 40) return chalk.red;
    return chalk.red.bold;
  }

  getStatusBadge(status) {
    const badges = {
      'not-started': chalk.gray('○'),
      'ready': chalk.blue('◷'),
      'in-progress': chalk.yellow('◐'),
      'blocked': chalk.red('■'),
      'completed': chalk.green('●')
    };
    return badges[status] || status;
  }

  generateProgressBar(progress, width = 20) {
    const filled = Math.round(width * progress / 100);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += chalk.green('█');
    }
    for (let i = 0; i < empty; i++) {
      bar += chalk.gray('░');
    }
    
    return bar;
  }

  getRecommendedAction(report) {
    if (report.health.overall >= 80) {
      return chalk.green('Continue');
    }
    
    if (report.issues.some(i => i.type === 'false_completion')) {
      return chalk.red('Revert');
    }
    
    if (report.issues.some(i => i.type === 'stuck')) {
      return chalk.yellow('Unstick');
    }
    
    if (report.health.overall < 40) {
      return chalk.red('Intervene');
    }
    
    return chalk.yellow('Review');
  }
}

// CLI execution
if (require.main === module) {
  const system = new IntegratedHealthSystem();
  const args = process.argv.slice(2);
  
  const options = {
    autoFix: args.includes('--fix') || args.includes('--auto-fix'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  system.run(options).then(result => {
    if (result.summary.critical > 0 && !options.autoFix) {
      console.log('\n' + chalk.yellow('Run with --fix to apply automatic remediations'));
    }
  });
}

module.exports = IntegratedHealthSystem;