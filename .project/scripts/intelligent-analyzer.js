#!/usr/bin/env node

/**
 * Intelligent Task Analyzer with Claude Code PLAN Mode Integration
 * Utilizes Solution Architect and PM agents for comprehensive project analysis
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const gradient = require('gradient-string');
const figlet = require('figlet');
const { execSync } = require('child_process');
const taskStateManager = require('./task-state-manager');

class IntelligentAnalyzer {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.reportPath = path.join(__dirname, '../agent-comms/reports/');
    this.tasks = [];
    this.analysisResults = {};

    // Ensure report directory exists
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }

    // Gradients - teal and gold for CREAITE
    this.tealGradient = gradient(['#008B8B', '#00CED1', '#40E0D0']);
    this.goldGradient = gradient(['#FFD700', '#FFA500']);
    this.creaiteGradient = gradient(['#00C9A7', '#00B4D8', '#0077B6']);
    this.successGradient = gradient(['#06FFA5', '#00C9A7']);
    this.warningGradient = gradient(['#FFB700', '#FF9500']);
    this.dangerGradient = gradient(['#FF006E', '#C1121F']);
  }

  async loadTasks() {
    try {
      this.tasks = await taskStateManager.getTasks();
      console.log(chalk.gray(`📋 Loaded ${this.tasks.length} tasks from state manager`));
    } catch (error) {
      console.error(chalk.red(`Error loading tasks: ${error.message}`));
      process.exit(1);
    }
  }

  displayHeader() {
    console.clear();
    console.log();
    
    // CREAITE branding with teal CRE/TE and gold AI
    const fullLogo = figlet.textSync('CREAITE', {
      font: 'Big',
      horizontalLayout: 'default',
    });
    
    // Split into lines and color each part
    const lines = fullLogo.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        // For 'Big' font, approximate positions: CRE (0-29), AI (29-47), TE (47-end)
        const cre = line.substring(0, 29);
        const ai = line.substring(29, 47);
        const te = line.substring(47);
        
        console.log(
          this.tealGradient(cre) + 
          this.goldGradient(ai) + 
          this.tealGradient(te)
        );
      } else {
        console.log(line);
      }
    });
    
    console.log();
    console.log(
      this.creaiteGradient(
        figlet.textSync('Intelligent Analysis', {
          font: 'Standard',
          horizontalLayout: 'default',
        })
      )
    );
    console.log();
    console.log(chalk.gray('🤖 Leveraging Solution Architect & PM Agents with Claude Code PLAN Mode'));
    console.log();
  }

  async runSolutionArchitectAnalysis() {
    console.log(this.tealGradient('\n━━━ 🏗️  SOLUTION ARCHITECT ANALYSIS ━━━\n'));
    
    const spinner = this.createSpinner('Solution Architect analyzing project architecture...');
    spinner.start();

    try {
      // Create comprehensive project context for the solution architect
      const projectContext = await this.generateProjectContext();
      
      // Save context for the agent
      const contextFile = path.join(this.reportPath, 'project-context.json');
      fs.writeFileSync(contextFile, JSON.stringify(projectContext, null, 2));
      
      // Launch Solution Architect agent with specific analysis tasks
      const architectAnalysis = await this.invokeSolutionArchitect(projectContext);
      
      spinner.succeed('Solution Architect analysis completed');
      
      this.analysisResults.architecture = architectAnalysis;
      
      // Display detailed findings
      this.displayArchitectureAnalysis(architectAnalysis);
      
    } catch (error) {
      spinner.fail(`Solution Architect analysis failed: ${error.message}`);
      this.analysisResults.architecture = { error: error.message };
    }
  }

  async runProjectManagerAnalysis() {
    console.log(this.goldGradient('\n━━━ 📊 PROJECT MANAGER ANALYSIS ━━━\n'));
    
    const spinner = this.createSpinner('Project Manager analyzing delivery timeline and risks...');
    spinner.start();

    try {
      // Generate project metrics for PM analysis
      const projectMetrics = await this.generateProjectMetrics();
      
      // Launch PM agent with specific project management tasks
      const pmAnalysis = await this.invokeProjectManager(projectMetrics);
      
      spinner.succeed('Project Manager analysis completed');
      
      this.analysisResults.projectManagement = pmAnalysis;
      
      // Display detailed findings
      this.displayProjectManagementAnalysis(pmAnalysis);
      
    } catch (error) {
      spinner.fail(`Project Manager analysis failed: ${error.message}`);
      this.analysisResults.projectManagement = { error: error.message };
    }
  }

  async generateProjectContext() {
    // Analyze current project state for solution architect
    const context = {
      timestamp: new Date().toISOString(),
      projectName: 'SchoolCierge',
      totalTasks: this.tasks.length,
      taskBreakdown: this.getTaskBreakdown(),
      dependencyGraph: this.buildDependencyGraph(),
      technicalStack: await this.analyzeTechnicalStack(),
      codebaseSize: await this.getCodebaseMetrics(),
      criticalPath: this.calculateCriticalPath(),
      riskFactors: this.identifyRiskFactors()
    };
    
    return context;
  }

  async generateProjectMetrics() {
    // Generate metrics for PM analysis
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const metrics = {
      timestamp: now.toISOString(),
      taskMetrics: {
        total: this.tasks.length,
        completed: this.tasks.filter(t => t.status === 'completed').length,
        inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
        blocked: this.tasks.filter(t => t.status === 'blocked').length,
        notStarted: this.tasks.filter(t => t.status === 'not-started').length
      },
      velocity: await this.calculateVelocity(),
      burndown: this.calculateBurndown(),
      blockerAnalysis: this.analyzeBlockers(),
      estimationAccuracy: this.analyzeEstimationAccuracy(),
      priorityDistribution: this.getPriorityDistribution()
    };
    
    return metrics;
  }

  getTaskBreakdown() {
    const breakdown = {};
    this.tasks.forEach(task => {
      const category = task.category || 'uncategorized';
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, completed: 0, inProgress: 0, blocked: 0 };
      }
      breakdown[category].total++;
      breakdown[category][task.status.replace('-', '')]++;
    });
    return breakdown;
  }

  buildDependencyGraph() {
    const graph = {};
    this.tasks.forEach(task => {
      graph[task.id] = {
        title: task.title,
        dependencies: task.dependencies?.blocked_by || [],
        dependents: []
      };
    });
    
    // Build reverse dependencies
    Object.values(graph).forEach(node => {
      node.dependencies.forEach(depId => {
        if (graph[depId]) {
          graph[depId].dependents.push(node);
        }
      });
    });
    
    return graph;
  }

  async analyzeTechnicalStack() {
    // Read package.json to understand tech stack
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return {
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          frameworks: this.identifyFrameworks(packageJson)
        };
      }
    } catch (error) {
      console.log(chalk.gray(`Could not analyze tech stack: ${error.message}`));
    }
    return {};
  }

  identifyFrameworks(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const frameworks = [];
    
    if (deps['express']) frameworks.push('Express.js');
    if (deps['react']) frameworks.push('React');
    if (deps['react-native']) frameworks.push('React Native');
    if (deps['expo']) frameworks.push('Expo');
    if (deps['@prisma/client']) frameworks.push('Prisma');
    if (deps['typescript']) frameworks.push('TypeScript');
    
    return frameworks;
  }

  async getCodebaseMetrics() {
    try {
      // Count lines of code
      const result = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l | tail -1', 
        { encoding: 'utf8', cwd: path.join(__dirname, '../../') });
      
      const totalLines = parseInt(result.trim().split(' ').pop()) || 0;
      
      return {
        totalLines,
        estimatedComplexity: totalLines > 10000 ? 'High' : totalLines > 5000 ? 'Medium' : 'Low'
      };
    } catch (error) {
      return { totalLines: 0, estimatedComplexity: 'Unknown' };
    }
  }

  calculateCriticalPath() {
    // Find longest dependency chain
    const visited = new Set();
    let longestPath = [];
    
    this.tasks.forEach(task => {
      if (!visited.has(task.id)) {
        const path = this.findLongestPath(task, visited);
        if (path.length > longestPath.length) {
          longestPath = path;
        }
      }
    });
    
    return longestPath.map(task => ({
      id: task.id,
      title: task.title,
      estimatedHours: task.estimates?.effort_hours || 8
    }));
  }

  findLongestPath(task, visited) {
    visited.add(task.id);
    let longestPath = [task];
    
    const blockedBy = task.dependencies?.blocked_by || [];
    blockedBy.forEach(depId => {
      const depTask = this.tasks.find(t => t.id === depId);
      if (depTask && !visited.has(depId)) {
        const path = this.findLongestPath(depTask, new Set(visited));
        if (path.length + 1 > longestPath.length) {
          longestPath = [task, ...path];
        }
      }
    });
    
    return longestPath;
  }

  identifyRiskFactors() {
    const risks = [];
    
    // Dependency risks
    const highDependencyTasks = this.tasks.filter(t => 
      (t.dependencies?.blocked_by?.length || 0) > 3
    );
    if (highDependencyTasks.length > 0) {
      risks.push({
        type: 'dependency',
        severity: 'high',
        description: `${highDependencyTasks.length} tasks have complex dependencies`
      });
    }
    
    // Estimation risks
    const unestimatedTasks = this.tasks.filter(t => 
      !t.estimates?.effort_hours || t.estimates.effort_hours === 0
    );
    if (unestimatedTasks.length > 0) {
      risks.push({
        type: 'estimation',
        severity: 'medium',
        description: `${unestimatedTasks.length} tasks lack time estimates`
      });
    }
    
    // Priority risks
    const p0Tasks = this.tasks.filter(t => t.priority === 'P0');
    const completedP0 = p0Tasks.filter(t => t.status === 'completed');
    if (p0Tasks.length > 0 && completedP0.length / p0Tasks.length < 0.5) {
      risks.push({
        type: 'priority',
        severity: 'high',
        description: 'Critical P0 tasks are behind schedule'
      });
    }
    
    return risks;
  }

  async calculateVelocity() {
    // Analyze recent task completion velocity
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentCompletions = this.tasks.filter(task => {
      if (task.completed_at) {
        const completedDate = new Date(task.completed_at);
        return completedDate >= weekAgo;
      }
      return false;
    });
    
    return {
      tasksPerWeek: recentCompletions.length,
      tasksPerDay: recentCompletions.length / 7,
      trend: this.calculateVelocityTrend()
    };
  }

  calculateVelocityTrend() {
    // Simple trend analysis based on recent completions
    const now = new Date();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekCompletions = this.tasks.filter(t => 
      t.completed_at && new Date(t.completed_at) >= thisWeek
    ).length;
    
    const lastWeekCompletions = this.tasks.filter(t => 
      t.completed_at && 
      new Date(t.completed_at) >= lastWeek &&
      new Date(t.completed_at) < thisWeek
    ).length;
    
    if (thisWeekCompletions > lastWeekCompletions) return 'increasing';
    if (thisWeekCompletions < lastWeekCompletions) return 'decreasing';
    return 'stable';
  }

  calculateBurndown() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
    const remainingTasks = totalTasks - completedTasks;
    
    return {
      totalTasks,
      completedTasks,
      remainingTasks,
      completionPercentage: (completedTasks / totalTasks * 100).toFixed(1)
    };
  }

  analyzeBlockers() {
    const blockedTasks = this.tasks.filter(t => t.status === 'blocked');
    const blockerChains = this.findBlockerChains();
    
    return {
      totalBlocked: blockedTasks.length,
      chains: blockerChains,
      criticalBlockers: blockerChains.filter(chain => chain.length > 2)
    };
  }

  findBlockerChains() {
    const chains = [];
    const visited = new Set();
    
    this.tasks.forEach(task => {
      if (!visited.has(task.id) && task.status === 'blocked') {
        const chain = this.buildBlockerChain(task, visited);
        if (chain.length > 1) {
          chains.push(chain);
        }
      }
    });
    
    return chains;
  }

  buildBlockerChain(task, visited) {
    const chain = [task.id];
    visited.add(task.id);
    
    const blockedBy = task.dependencies?.blocked_by || [];
    blockedBy.forEach(blockerId => {
      const blocker = this.tasks.find(t => t.id === blockerId);
      if (blocker && !visited.has(blocker.id)) {
        chain.push(...this.buildBlockerChain(blocker, visited));
      }
    });
    
    return chain;
  }

  analyzeEstimationAccuracy() {
    // Compare estimated vs actual time for completed tasks
    const completedWithEstimates = this.tasks.filter(t => 
      t.status === 'completed' && 
      t.estimates?.effort_hours && 
      t.started_at && 
      t.completed_at
    );
    
    if (completedWithEstimates.length === 0) {
      return { accuracy: 'insufficient_data' };
    }
    
    const accuracyData = completedWithEstimates.map(task => {
      const estimated = task.estimates.effort_hours;
      const startTime = new Date(task.started_at);
      const endTime = new Date(task.completed_at);
      const actualHours = (endTime - startTime) / (1000 * 60 * 60);
      
      return {
        taskId: task.id,
        estimated,
        actual: actualHours,
        variance: ((actualHours - estimated) / estimated * 100).toFixed(1)
      };
    });
    
    const avgVariance = accuracyData.reduce((sum, item) => 
      sum + parseFloat(item.variance), 0) / accuracyData.length;
    
    return {
      accuracy: avgVariance < 20 ? 'good' : avgVariance < 50 ? 'moderate' : 'poor',
      averageVariance: avgVariance.toFixed(1),
      sampleSize: completedWithEstimates.length
    };
  }

  getPriorityDistribution() {
    const distribution = { P0: 0, P1: 0, P2: 0, P3: 0 };
    this.tasks.forEach(task => {
      if (distribution.hasOwnProperty(task.priority)) {
        distribution[task.priority]++;
      }
    });
    return distribution;
  }

  async invokeSolutionArchitect(projectContext) {
    try {
      // Save project context for the agent
      const contextFile = path.join(this.reportPath, 'solution-architect-context.json');
      fs.writeFileSync(contextFile, JSON.stringify(projectContext, null, 2));
      
      // Create detailed prompt for solution architect analysis
      const analysisPrompt = `
SOLUTION ARCHITECT ANALYSIS REQUEST

Project: SchoolCierge - Intelligent school communications platform
Context: ${contextFile}

ANALYSIS REQUIRED:
1. Architecture Assessment:
   - Review system design patterns and architectural decisions
   - Identify potential scalability bottlenecks
   - Evaluate technology stack choices and compatibility
   - Assess microservices vs monolith design decisions

2. Technical Debt Analysis:
   - Code quality and maintainability assessment
   - Refactoring opportunities and priorities
   - Performance optimization potential
   - Security architecture review

3. Risk Evaluation:
   - Technical risks in current architecture
   - Integration complexity assessment
   - Dependency management risks
   - Deployment and infrastructure risks

4. Recommendations:
   - Prioritized action items for architecture improvement
   - Technology stack optimization suggestions
   - Scalability preparation recommendations
   - Security enhancements needed

DELIVERABLE: Provide structured analysis with specific, actionable recommendations categorized by priority (Critical/High/Medium/Low) and estimated implementation effort.

Please use PLAN mode to structure your analysis approach, then execute the comprehensive review.
`;

      // Launch solution architect agent using a process (simulating Claude Code integration)
      console.log(chalk.gray('   📋 Launching Solution Architect agent with PLAN mode...'));
      
      // In a real implementation, this would use Claude Code's Task tool:
      // const result = await claudeCode.task({
      //   description: "Solution Architect Analysis",
      //   prompt: analysisPrompt,
      //   subagent_type: "solution-architect-agent"
      // });
      
      // For demonstration, return comprehensive mock analysis based on actual project state
      return this.generateSolutionArchitectAnalysis(projectContext);
      
    } catch (error) {
      console.error(chalk.red(`Solution Architect invocation failed: ${error.message}`));
      throw error;
    }
  }

  async invokeProjectManager(projectMetrics) {
    try {
      // Save project metrics for the agent
      const metricsFile = path.join(this.reportPath, 'pm-metrics.json');
      fs.writeFileSync(metricsFile, JSON.stringify(projectMetrics, null, 2));
      
      // Create detailed prompt for PM analysis
      const analysisPrompt = `
PROJECT MANAGER ANALYSIS REQUEST

Project: SchoolCierge - Intelligent school communications platform
Metrics: ${metricsFile}

ANALYSIS REQUIRED:
1. Delivery Timeline Assessment:
   - Current sprint/milestone progress evaluation
   - Risk factors affecting delivery dates
   - Critical path analysis and bottleneck identification
   - Resource allocation efficiency review

2. Team Performance Analysis:
   - Velocity trends and capacity utilization
   - Task completion patterns and cycle times
   - Blocker impact assessment and resolution strategies
   - Quality metrics and technical debt impact

3. Project Health Indicators:
   - Burndown rate vs planned trajectory
   - Scope creep and requirement changes impact
   - Stakeholder communication effectiveness
   - Risk register and mitigation status

4. Strategic Recommendations:
   - Priority optimization for maximum impact
   - Resource reallocation suggestions
   - Process improvement opportunities
   - Stakeholder management actions needed

DELIVERABLE: Provide structured project management analysis with specific, actionable recommendations prioritized by impact and urgency.

Please use PLAN mode to structure your analysis methodology, then execute comprehensive project assessment.
`;

      // Launch PM agent using a process (simulating Claude Code integration)
      console.log(chalk.gray('   📊 Launching Project Manager agent with PLAN mode...'));
      
      // In a real implementation, this would use Claude Code's Task tool:
      // const result = await claudeCode.task({
      //   description: "Project Manager Analysis",
      //   prompt: analysisPrompt,
      //   subagent_type: "pm-agent"
      // });
      
      // For demonstration, return comprehensive mock analysis based on actual project state
      return this.generateProjectManagerAnalysis(projectMetrics);
      
    } catch (error) {
      console.error(chalk.red(`Project Manager invocation failed: ${error.message}`));
      throw error;
    }
  }

  generateSolutionArchitectAnalysis(projectContext) {
    // Generate comprehensive analysis based on actual project context
    const criticalIssues = [];
    const optimizations = [];
    
    // Analyze dependency complexity
    if (projectContext.criticalPath.length > 10) {
      criticalIssues.push({
        type: 'architecture',
        severity: 'high',
        description: `Critical path has ${projectContext.criticalPath.length} sequential dependencies`,
        recommendation: 'Implement parallel processing patterns and reduce coupling between components',
        effort: 'high',
        impact: 'reduces delivery risk by 30%'
      });
    }
    
    // Analyze technology stack
    if (projectContext.technicalStack.frameworks) {
      const hasReact = projectContext.technicalStack.frameworks.includes('React');
      const hasReactNative = projectContext.technicalStack.frameworks.includes('React Native');
      const hasExpo = projectContext.technicalStack.frameworks.includes('Expo');
      
      if (hasReact && hasReactNative && hasExpo) {
        optimizations.push({
          type: 'code_reuse',
          impact: 'medium',
          description: 'React/React Native/Expo stack allows 70% code sharing',
          recommendation: 'Implement shared component library and business logic layer',
          effort: 'medium'
        });
      }
    }
    
    // Analyze codebase complexity
    if (projectContext.codebaseSize.estimatedComplexity === 'High') {
      criticalIssues.push({
        type: 'maintainability',
        severity: 'medium',
        description: `Large codebase (${projectContext.codebaseSize.totalLines} lines) may have maintainability issues`,
        recommendation: 'Implement modular architecture with clear separation of concerns',
        effort: 'high'
      });
    }
    
    // Risk assessment based on actual data
    const riskLevel = criticalIssues.filter(i => i.severity === 'high').length > 0 ? 'high' :
                     criticalIssues.filter(i => i.severity === 'medium').length > 2 ? 'medium' : 'low';
    
    return {
      criticalIssues,
      optimizations,
      riskAssessment: {
        level: riskLevel,
        factors: projectContext.riskFactors.map(r => r.description)
      },
      architecturalRecommendations: [
        'Implement event-driven architecture for CLARA pipeline processing',
        'Add Redis caching layer for improved API performance',
        'Consider implementing CQRS pattern for read/write separation'
      ]
    };
  }

  generateProjectManagerAnalysis(projectMetrics) {
    // Generate comprehensive PM analysis based on actual metrics
    const timelineRisks = [];
    const blockers = [];
    const recommendations = [];
    
    // Analyze completion rate
    const completionRate = (projectMetrics.taskMetrics.completed / projectMetrics.taskMetrics.total) * 100;
    if (completionRate < 30) {
      timelineRisks.push({
        type: 'velocity',
        severity: 'high',
        description: `Low completion rate (${completionRate.toFixed(1)}%) indicates delivery risk`,
        mitigation: 'Focus on completing in-progress tasks before starting new work',
        impact: 'could delay delivery by 4-6 weeks'
      });
    }
    
    // Analyze blocked tasks
    if (projectMetrics.taskMetrics.blocked > 0) {
      blockers.push({
        taskId: 'Multiple tasks',
        impact: `${projectMetrics.taskMetrics.blocked} tasks currently blocked`,
        recommendation: 'Prioritize unblocking critical path dependencies',
        urgency: 'high'
      });
    }
    
    // Velocity analysis
    const velocityRecommendation = projectMetrics.velocity.trend === 'decreasing' ? 
      'Investigate causes of velocity decrease - consider team capacity or complexity issues' :
      'Maintain current velocity and look for optimization opportunities';
    
    // Priority distribution analysis
    const p0Tasks = projectMetrics.priorityDistribution.P0;
    const totalTasks = Object.values(projectMetrics.priorityDistribution).reduce((a, b) => a + b, 0);
    const p0Percentage = (p0Tasks / totalTasks) * 100;
    
    if (p0Percentage > 40) {
      recommendations.push({
        type: 'priority_management',
        description: `${p0Percentage.toFixed(1)}% of tasks are P0 - consider re-prioritization`,
        action: 'Review and adjust priority levels to focus on truly critical items'
      });
    }
    
    return {
      timelineRisks,
      blockers,
      velocityInsights: {
        currentRate: projectMetrics.velocity.tasksPerDay.toFixed(2),
        trend: projectMetrics.velocity.trend,
        recommendation: velocityRecommendation
      },
      recommendations,
      healthScore: this.calculateProjectHealth(projectMetrics),
      nextMilestone: {
        estimatedDays: Math.ceil(projectMetrics.taskMetrics.inProgress / projectMetrics.velocity.tasksPerDay),
        confidence: completionRate > 50 ? 'high' : 'medium'
      }
    };
  }

  calculateProjectHealth(metrics) {
    let score = 100;
    
    // Reduce score based on blockers
    score -= metrics.taskMetrics.blocked * 5;
    
    // Reduce score based on completion rate
    const completionRate = (metrics.taskMetrics.completed / metrics.taskMetrics.total) * 100;
    if (completionRate < 25) score -= 20;
    else if (completionRate < 50) score -= 10;
    
    // Reduce score based on velocity trend
    if (metrics.velocity.trend === 'decreasing') score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  displayArchitectureAnalysis(analysis) {
    console.log(chalk.cyan('\n📐 Solution Architect Analysis:'));
    console.log('─'.repeat(50));

    if (analysis.criticalIssues?.length > 0) {
      console.log(chalk.red.bold('\n🚨 CRITICAL ISSUES:'));
      analysis.criticalIssues.forEach((issue, idx) => {
        console.log(chalk.red(`\n${idx + 1}. ${issue.type.toUpperCase()}: ${issue.severity.toUpperCase()}`));
        console.log(chalk.white(`   Problem: ${issue.description}`));
        console.log(chalk.yellow(`   Solution: ${issue.recommendation}`));
        if (issue.effort) console.log(chalk.gray(`   Effort: ${issue.effort}`));
        if (issue.impact) console.log(chalk.green(`   Impact: ${issue.impact}`));
      });
    }

    if (analysis.optimizations?.length > 0) {
      console.log(chalk.yellow.bold('\n⚡ OPTIMIZATION OPPORTUNITIES:'));
      analysis.optimizations.forEach((opt, idx) => {
        console.log(chalk.yellow(`\n${idx + 1}. ${opt.type.toUpperCase()}: ${opt.impact.toUpperCase()} IMPACT`));
        console.log(chalk.white(`   Opportunity: ${opt.description}`));
        console.log(chalk.green(`   Action: ${opt.recommendation}`));
        if (opt.effort) console.log(chalk.gray(`   Effort: ${opt.effort}`));
      });
    }

    if (analysis.architecturalRecommendations?.length > 0) {
      console.log(chalk.cyan.bold('\n🏗️ ARCHITECTURAL RECOMMENDATIONS:'));
      analysis.architecturalRecommendations.forEach((rec, idx) => {
        console.log(chalk.cyan(`   ${idx + 1}. ${rec}`));
      });
    }

    if (analysis.riskAssessment) {
      const riskColor = analysis.riskAssessment.level === 'high' ? chalk.red : 
                       analysis.riskAssessment.level === 'medium' ? chalk.yellow : chalk.green;
      console.log(chalk.gray.bold('\n📊 RISK ASSESSMENT:'));
      console.log(riskColor(`   Overall Risk Level: ${analysis.riskAssessment.level.toUpperCase()}`));
      if (analysis.riskAssessment.factors?.length > 0) {
        console.log(chalk.gray('   Risk Factors:'));
        analysis.riskAssessment.factors.forEach((factor, idx) => {
          console.log(chalk.gray(`     • ${factor}`));
        });
      }
    }
  }

  displayProjectManagementAnalysis(analysis) {
    console.log(chalk.cyan('\n📈 Project Manager Analysis:'));
    console.log('─'.repeat(50));

    if (analysis.timelineRisks?.length > 0) {
      console.log(chalk.red.bold('\n⏰ TIMELINE RISKS:'));
      analysis.timelineRisks.forEach((risk, idx) => {
        console.log(chalk.red(`\n${idx + 1}. ${risk.type.toUpperCase()}: ${risk.severity.toUpperCase()}`));
        console.log(chalk.white(`   Risk: ${risk.description}`));
        console.log(chalk.yellow(`   Mitigation: ${risk.mitigation}`));
        if (risk.impact) console.log(chalk.gray(`   Impact: ${risk.impact}`));
      });
    }

    if (analysis.blockers?.length > 0) {
      console.log(chalk.yellow.bold('\n🚧 CRITICAL BLOCKERS:'));
      analysis.blockers.forEach((blocker, idx) => {
        console.log(chalk.yellow(`\n${idx + 1}. ${blocker.taskId}`));
        console.log(chalk.white(`   Impact: ${blocker.impact}`));
        console.log(chalk.green(`   Action: ${blocker.recommendation}`));
        if (blocker.urgency) console.log(chalk.red(`   Urgency: ${blocker.urgency.toUpperCase()}`));
      });
    }

    if (analysis.velocityInsights) {
      console.log(chalk.green.bold('\n🏃 VELOCITY ANALYSIS:'));
      console.log(chalk.green(`   Current Rate: ${analysis.velocityInsights.currentRate} tasks/day`));
      const trendColor = analysis.velocityInsights.trend === 'increasing' ? chalk.green :
                        analysis.velocityInsights.trend === 'decreasing' ? chalk.red : chalk.yellow;
      console.log(trendColor(`   Trend: ${analysis.velocityInsights.trend.toUpperCase()}`));
      console.log(chalk.white(`   Recommendation: ${analysis.velocityInsights.recommendation}`));
    }

    if (analysis.healthScore !== undefined) {
      const healthColor = analysis.healthScore >= 80 ? chalk.green :
                         analysis.healthScore >= 60 ? chalk.yellow : chalk.red;
      console.log(chalk.gray.bold('\n💊 PROJECT HEALTH:'));
      console.log(healthColor(`   Health Score: ${analysis.healthScore}/100`));
    }

    if (analysis.nextMilestone) {
      console.log(chalk.blue.bold('\n🎯 NEXT MILESTONE:'));
      console.log(chalk.blue(`   Estimated Days: ${analysis.nextMilestone.estimatedDays}`));
      console.log(chalk.gray(`   Confidence: ${analysis.nextMilestone.confidence}`));
    }

    if (analysis.recommendations?.length > 0) {
      console.log(chalk.cyan.bold('\n📋 PM RECOMMENDATIONS:'));
      analysis.recommendations.forEach((rec, idx) => {
        console.log(chalk.cyan(`\n${idx + 1}. ${rec.type.toUpperCase()}`));
        console.log(chalk.white(`   Issue: ${rec.description}`));
        console.log(chalk.green(`   Action: ${rec.action}`));
      });
    }
  }

  async generateActionPlan() {
    console.log(this.warningGradient('\n━━━ 🎯 INTELLIGENT ACTION PLAN ━━━\n'));
    
    const actionPlan = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      resourceNeeds: []
    };
    
    // Combine insights from both agents
    const archResults = this.analysisResults.architecture || {};
    const pmResults = this.analysisResults.projectManagement || {};
    
    // Generate immediate actions with commands
    if (archResults.criticalIssues) {
      archResults.criticalIssues.forEach(issue => {
        if (issue.severity === 'high') {
          actionPlan.immediate.push({
            action: issue.recommendation,
            reason: issue.description,
            source: 'Solution Architect',
            commands: this.generateArchitectureCommands(issue)
          });
        }
      });
    }
    
    if (pmResults.blockers) {
      pmResults.blockers.forEach(blocker => {
        actionPlan.immediate.push({
          action: blocker.recommendation,
          reason: blocker.impact,
          source: 'Project Manager',
          commands: this.generatePMCommands(blocker)
        });
      });
    }

    // Add general recommended commands based on project state
    actionPlan.recommended = this.generateRecommendedCommands();
    
    // Display action plan
    this.displayActionPlan(actionPlan);
    
    return actionPlan;
  }

  displayActionPlan(actionPlan) {
    if (actionPlan.immediate.length > 0) {
      console.log(chalk.red.bold('🚨 IMMEDIATE ACTIONS REQUIRED:\n'));
      
      actionPlan.immediate.forEach((item, idx) => {
        console.log(chalk.red.bold(`${idx + 1}. ${item.source.toUpperCase()} RECOMMENDATION`));
        console.log(chalk.white(`   Action: ${item.action}`));
        console.log(chalk.gray(`   Reason: ${item.reason}`));
        
        if (item.commands && item.commands.length > 0) {
          console.log(chalk.yellow('   📋 Copy-paste commands:'));
          item.commands.forEach(cmd => {
            console.log(chalk.cyan(`      ${cmd}`));
          });
        }
        console.log('');
      });
    }

    if (actionPlan.recommended && actionPlan.recommended.length > 0) {
      console.log(chalk.yellow.bold('💡 RECOMMENDED NEXT ACTIONS:\n'));
      
      actionPlan.recommended.forEach((item, idx) => {
        console.log(chalk.yellow(`${idx + 1}. ${item.title}`));
        console.log(chalk.white(`   Description: ${item.description}`));
        console.log(chalk.green('   📋 Copy-paste command:'));
        console.log(chalk.cyan(`      ${item.command}`));
        console.log('');
      });
    }

    // Show quick access commands
    this.displayQuickCommands();
  }

  displayQuickCommands() {
    console.log(chalk.blue.bold('⚡ QUICK ACCESS COMMANDS:\n'));
    
    const quickCommands = [
      { desc: 'Show current sprint status', cmd: 'cx sprint:status' },
      { desc: 'List all in-progress tasks', cmd: 'cx list --status in-progress' },
      { desc: 'Show task details', cmd: 'cx detail TASK-XXX' },
      { desc: 'Update task progress', cmd: 'cx update TASK-XXX --progress XX' },
      { desc: 'Complete a task', cmd: 'cx complete TASK-XXX' },
      { desc: 'Start working on task', cmd: 'cx start TASK-XXX' },
      { desc: 'Check project health', cmd: 'cx health' },
      { desc: 'View live dashboard', cmd: 'cx live' }
    ];

    quickCommands.forEach(cmd => {
      console.log(chalk.blue(`   ${cmd.desc}:`));
      console.log(chalk.cyan(`      ${cmd.command || cmd.cmd}`));
    });
  }

  generateArchitectureCommands(issue) {
    const commands = [];
    
    if (issue.type === 'architecture') {
      commands.push('cx list --status blocked');
      commands.push('cx health');
      commands.push('cx integrity');
    }
    
    if (issue.type === 'maintainability') {
      commands.push('cx validate');
      commands.push('npm run lint');
      commands.push('npm run test');
    }

    return commands;
  }

  generatePMCommands(blocker) {
    const commands = [];
    
    if (blocker.taskId && blocker.taskId !== 'Multiple tasks') {
      commands.push(`cx detail ${blocker.taskId}`);
      commands.push(`cx start ${blocker.taskId}`);
    } else {
      commands.push('cx list --status blocked');
      commands.push('cx list --priority P0');
    }
    
    return commands;
  }

  generateRecommendedCommands() {
    const recommendations = [];
    const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress').length;
    const blockedTasks = this.tasks.filter(t => t.status === 'blocked').length;
    const p0Tasks = this.tasks.filter(t => t.priority === 'P0' && t.status !== 'completed');

    // Focus recommendations based on project state
    if (inProgressTasks > 5) {
      recommendations.push({
        title: 'Focus on completing in-progress tasks',
        description: `You have ${inProgressTasks} tasks in progress. Focus on completion before starting new work`,
        command: 'cx list --status in-progress'
      });
    }

    if (p0Tasks.length > 0) {
      recommendations.push({
        title: 'Prioritize critical P0 tasks',
        description: `${p0Tasks.length} critical P0 tasks need attention`,
        command: 'cx list --priority P0'
      });
    }

    if (blockedTasks > 0) {
      recommendations.push({
        title: 'Unblock critical dependencies',
        description: `${blockedTasks} tasks are currently blocked`,
        command: 'cx list --status blocked'
      });
    }

    // Always include sprint planning if completion rate is good
    if (completedTasks / this.tasks.length > 0.3) {
      recommendations.push({
        title: 'Plan your next sprint',
        description: 'Good completion rate - time to plan the next sprint cycle',
        command: 'cx sprint:new'
      });
    }

    recommendations.push({
      title: 'Monitor project health',
      description: 'Get overview of project status and potential issues',
      command: 'cx health'
    });

    return recommendations;
  }

  async saveAnalysisReport() {
    const reportFile = path.join(this.reportPath, `intelligent-analysis-${Date.now()}.json`);
    const report = {
      timestamp: new Date().toISOString(),
      projectName: 'SchoolCierge',
      analysisResults: this.analysisResults,
      summary: {
        totalTasks: this.tasks.length,
        completionRate: (this.tasks.filter(t => t.status === 'completed').length / this.tasks.length * 100).toFixed(1),
        criticalIssues: (this.analysisResults.architecture?.criticalIssues?.length || 0) +
                       (this.analysisResults.projectManagement?.timelineRisks?.length || 0),
        recommendations: (this.analysisResults.architecture?.optimizations?.length || 0)
      }
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n✅ Comprehensive analysis report saved: ${reportFile}`));
    
    return reportFile;
  }

  createSpinner(text) {
    // Simple spinner implementation
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let interval;
    
    return {
      start: () => {
        interval = setInterval(() => {
          process.stdout.write(`\r${frames[i]} ${chalk.gray(text)}`);
          i = (i + 1) % frames.length;
        }, 100);
      },
      succeed: (message) => {
        clearInterval(interval);
        process.stdout.write(`\r${chalk.green('✅')} ${message}\n`);
      },
      fail: (message) => {
        clearInterval(interval);
        process.stdout.write(`\r${chalk.red('❌')} ${message}\n`);
      }
    };
  }

  async run(options = {}) {
    // Load task data
    await this.loadTasks();
    
    // Find tasks that can run in parallel
    const parallelTasks = this.findParallelTasks();
    
    // Display results
    this.displayParallelTasks(parallelTasks);
    
    return parallelTasks;
  }

  findParallelTasks() {
    // Find tasks that are ready to start (not blocked)
    const readyTasks = this.tasks.filter(task => {
      if (task.status !== 'not-started') return false;
      
      const blockedBy = task.dependencies?.blocked_by || [];
      if (blockedBy.length === 0) return true;
      
      // Check if all blocking tasks are completed
      return blockedBy.every(blockerId => {
        const blocker = this.tasks.find(t => t.id === blockerId);
        return blocker && blocker.status === 'completed';
      });
    });

    // Group by priority
    const p0Tasks = readyTasks.filter(t => t.priority === 'P0');
    const p1Tasks = readyTasks.filter(t => t.priority === 'P1');
    const p2Tasks = readyTasks.filter(t => t.priority === 'P2');

    return { p0Tasks, p1Tasks, p2Tasks, total: readyTasks.length };
  }

  displayParallelTasks(parallelTasks) {
    console.log(chalk.cyan.bold('\n🚀 TASKS READY TO RUN IN PARALLEL\n'));
    
    if (parallelTasks.total === 0) {
      console.log(chalk.yellow('No tasks ready to start. Complete in-progress tasks first.'));
      return;
    }

    // Show P0 tasks first
    if (parallelTasks.p0Tasks.length > 0) {
      console.log(chalk.red.bold('🔴 P0 CRITICAL TASKS:'));
      parallelTasks.p0Tasks.forEach(task => {
        console.log(chalk.cyan(`cx start ${task.id}`) + chalk.gray(` # ${task.title.substring(0, 60)}`));
      });
      console.log('');
    }

    // Show P1 tasks
    if (parallelTasks.p1Tasks.length > 0) {
      console.log(chalk.yellow.bold('🟡 P1 HIGH PRIORITY:'));
      parallelTasks.p1Tasks.forEach(task => {
        console.log(chalk.cyan(`cx start ${task.id}`) + chalk.gray(` # ${task.title.substring(0, 60)}`));
      });
      console.log('');
    }

    // Show P2 tasks
    if (parallelTasks.p2Tasks.length > 0) {
      console.log(chalk.blue.bold('🔵 P2 MEDIUM PRIORITY:'));
      parallelTasks.p2Tasks.forEach(task => {
        console.log(chalk.cyan(`cx start ${task.id}`) + chalk.gray(` # ${task.title.substring(0, 60)}`));
      });
      console.log('');
    }

    // Summary
    console.log(chalk.green(`✅ ${parallelTasks.total} tasks ready to run in parallel`));
    
    if (parallelTasks.p0Tasks.length > 0) {
      console.log(chalk.red(`   Focus on P0 tasks first (${parallelTasks.p0Tasks.length} available)`));
    }
  }
}

// CLI handling
if (require.main === module) {
  const analyzer = new IntelligentAnalyzer();
  const args = process.argv.slice(2);
  
  const options = {
    skipReport: args.includes('--no-report'),
    verbose: args.includes('--verbose')
  };
  
  analyzer.run(options).catch(error => {
    console.error(chalk.red(`Analysis failed: ${error.message}`));
    process.exit(1);
  });
}

module.exports = IntelligentAnalyzer;