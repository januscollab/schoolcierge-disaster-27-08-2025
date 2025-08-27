#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logEvent } = require('../event-ticker');

class TaskIntelligence {
  constructor() {
    this.tasksPath = path.join(__dirname, '../../tasks/backlog.json');
    
    // Domain classification keywords
    this.domainKeywords = {
      infrastructure: {
        keywords: ['railway', 'deploy', 'database', 'redis', 'postgres', 'server', 'hosting', 'cloud', 'docker', 'container'],
        weight: 1.0,
        agent: 'infrastructure-devops-agent',
        mcps: ['railway-mcp-server', 'docker-mcp', 'filesystem']
      },
      mobile: {
        keywords: ['expo', 'react native', 'tamagui', 'app', 'ios', 'android', 'mobile', 'native', 'device'],
        weight: 1.0,
        agent: 'mobile-app-agent',
        mcps: ['context7', 'github', 'filesystem']
      },
      backend: {
        keywords: ['api', 'express', 'node', 'server', 'endpoint', 'prisma', 'rest', 'graphql', 'microservice'],
        weight: 1.0,
        agent: 'backend-api-agent',
        mcps: ['context7', 'railway-mcp-server', 'github', 'filesystem']
      },
      auth: {
        keywords: ['clerk', 'authentication', 'login', 'oauth', 'jwt', 'auth', 'security', 'session', 'token'],
        weight: 1.0,
        agent: 'auth-agent',
        mcps: ['context7', 'github', 'filesystem']
      },
      security: {
        keywords: ['audit', 'vulnerability', 'secure', 'encrypt', 'ssl', 'https', 'firewall', 'permissions'],
        weight: 1.0,
        agent: 'security-agent',
        mcps: ['github', 'context7', 'filesystem']
      },
      frontend: {
        keywords: ['ui', 'component', 'react', 'web', 'css', 'html', 'design', 'interface', 'ux'],
        weight: 1.0,
        agent: 'designer-agent',
        mcps: ['context7', 'puppeteer', 'github', 'filesystem']
      },
      database: {
        keywords: ['prisma', 'sql', 'schema', 'migration', 'query', 'table', 'data', 'orm'],
        weight: 1.0,
        agent: 'database-agent',
        mcps: ['railway-mcp-server', 'context7', 'filesystem']
      },
      testing: {
        keywords: ['test', 'spec', 'jest', 'cypress', 'e2e', 'unit', 'integration', 'qa', 'quality'],
        weight: 1.0,
        agent: 'test-automation-agent',
        mcps: ['github', 'puppeteer', 'context7', 'filesystem']
      },
      devops: {
        keywords: ['ci', 'cd', 'pipeline', 'github actions', 'workflow', 'automation', 'build', 'release'],
        weight: 1.0,
        agent: 'github-agent',
        mcps: ['github', 'railway-mcp-server', 'filesystem']
      }
    };

    // Complexity indicators
    this.complexityIndicators = {
      simple: ['add', 'update', 'fix', 'change', 'modify', 'edit'],
      medium: ['implement', 'create', 'build', 'develop', 'integrate', 'setup'],
      complex: ['architect', 'design', 'refactor', 'migrate', 'optimize', 'scale'],
      epic: ['system', 'platform', 'framework', 'infrastructure', 'complete', 'full']
    };
  }

  loadTask(taskId) {
    try {
      const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
      return tasks.find(t => t.id === taskId);
    } catch (error) {
      logEvent('error', `Failed to load task ${taskId}`, { error: error.message });
      return null;
    }
  }

  analyzeTask(taskId) {
    const task = this.loadTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const analysis = {
      taskId: task.id,
      title: task.title,
      domain: this.classifyDomain(task),
      complexity: this.assessComplexity(task),
      dependencies: this.analyzeDependencies(task),
      context: this.gatherContext(task),
      timestamp: new Date().toISOString()
    };

    // Determine agents and MCPs based on domain and complexity
    analysis.routing = this.determineRouting(analysis);

    logEvent('task_analysis', `Analyzed ${taskId}: ${analysis.domain.primary} domain, ${analysis.complexity} complexity`, analysis);

    return analysis;
  }

  classifyDomain(task) {
    const text = `${task.title} ${task.description || ''} ${task.category || ''}`.toLowerCase();
    const scores = {};

    // Score each domain based on keyword matches
    Object.entries(this.domainKeywords).forEach(([domain, config]) => {
      let score = 0;
      config.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += config.weight;
        }
      });
      scores[domain] = score;
    });

    // Sort by score
    const sortedDomains = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);

    return {
      primary: sortedDomains[0]?.[0] || 'general',
      secondary: sortedDomains[1]?.[0] || null,
      confidence: sortedDomains[0]?.[1] || 0,
      allScores: scores
    };
  }

  assessComplexity(task) {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    
    // Check for complexity indicators
    for (const [level, indicators] of Object.entries(this.complexityIndicators)) {
      for (const indicator of indicators) {
        if (text.includes(indicator)) {
          return level;
        }
      }
    }

    // Default complexity based on other factors
    const hasMultipleDeps = task.dependencies?.required_for?.length > 2;
    const hasBlockers = task.dependencies?.blocked_by?.length > 0;
    const isP0 = task.priority === 'P0';

    if (hasMultipleDeps || (hasBlockers && isP0)) return 'complex';
    if (hasBlockers || isP0) return 'medium';
    return 'simple';
  }

  analyzeDependencies(task) {
    const analysis = {
      blockedBy: task.dependencies?.blocked_by || [],
      blocking: task.dependencies?.required_for || [],
      hasCircularDeps: false,
      criticalPath: this.isOnCriticalPath(task),
      dependencyCount: {
        upstream: task.dependencies?.blocked_by?.length || 0,
        downstream: task.dependencies?.required_for?.length || 0
      }
    };

    // Check for circular dependencies (basic check)
    if (analysis.blockedBy.includes(task.id)) {
      analysis.hasCircularDeps = true;
    }

    return analysis;
  }

  gatherContext(task) {
    return {
      category: task.category,
      priority: task.priority,
      status: task.status,
      progress: task.progress || 0,
      created: task.created_at,
      updated: task.updated_at,
      estimatedHours: task.estimated_hours,
      tags: task.tags || []
    };
  }

  determineRouting(analysis) {
    const domain = this.domainKeywords[analysis.domain.primary] || this.domainKeywords.general;
    
    const routing = {
      primaryAgent: domain.agent || 'pm-agent',
      secondaryAgents: this.getSecondaryAgents(analysis),
      mcps: domain.mcps || ['filesystem', 'context7'],
      workflow: this.determineWorkflow(analysis)
    };

    // Add project manager for complex tasks
    if (analysis.complexity === 'complex' || analysis.complexity === 'epic') {
      routing.orchestrator = 'pm-agent';
    }

    // Add architecture review for complex infrastructure
    if (analysis.domain.primary === 'infrastructure' && analysis.complexity !== 'simple') {
      routing.secondaryAgents.push('solution-architect-agent');
    }

    return routing;
  }

  getSecondaryAgents(analysis) {
    const agents = [];

    // Always include memory search for context
    agents.push('memory-search-agent');

    // Add testing for any implementation task
    if (!['testing'].includes(analysis.domain.primary) && analysis.complexity !== 'simple') {
      agents.push('test-automation-agent');
    }

    // Add security for sensitive domains
    if (['auth', 'backend', 'infrastructure'].includes(analysis.domain.primary)) {
      agents.push('security-agent');
    }

    // Add github agent for any code-related task
    if (['backend', 'frontend', 'mobile'].includes(analysis.domain.primary)) {
      agents.push('github-agent');
    }

    return [...new Set(agents)]; // Remove duplicates
  }

  determineWorkflow(analysis) {
    const baseWorkflow = [
      { phase: 'analysis', agent: 'memory-search-agent', mcps: ['context7'] },
      { phase: 'planning', agent: analysis.routing?.primaryAgent || 'pm-agent', mcps: ['context7'] },
      { phase: 'implementation', agent: analysis.routing?.primaryAgent, mcps: analysis.routing?.mcps },
      { phase: 'validation', agent: 'test-automation-agent', mcps: ['github'] }
    ];

    // Customize workflow based on complexity
    if (analysis.complexity === 'complex' || analysis.complexity === 'epic') {
      baseWorkflow.splice(1, 0, { 
        phase: 'architecture', 
        agent: 'solution-architect-agent', 
        mcps: ['context7', 'filesystem'] 
      });
    }

    // Add security review for sensitive tasks
    if (['auth', 'security', 'backend'].includes(analysis.domain.primary)) {
      baseWorkflow.splice(-1, 0, { 
        phase: 'security', 
        agent: 'security-agent', 
        mcps: ['context7', 'github'] 
      });
    }

    return baseWorkflow;
  }

  isOnCriticalPath(task) {
    // Simplified critical path detection
    return task.priority === 'P0' || (task.dependencies?.required_for?.length || 0) > 2;
  }

  // Quick analysis for command routing
  quickAnalyze(taskId) {
    const task = this.loadTask(taskId);
    if (!task) return null;

    const domain = this.classifyDomain(task);
    const complexity = this.assessComplexity(task);

    return {
      taskId,
      domain: domain.primary,
      agent: this.domainKeywords[domain.primary]?.agent || 'pm-agent',
      mcps: this.domainKeywords[domain.primary]?.mcps || ['filesystem'],
      complexity,
      priority: task.priority
    };
  }
}

module.exports = TaskIntelligence;