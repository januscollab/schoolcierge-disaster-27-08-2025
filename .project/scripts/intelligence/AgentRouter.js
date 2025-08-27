#!/usr/bin/env node

// const { Task } = require('../../../src/task-tool'); // TODO: Implement when Task tool is ready
const { logEvent } = require('../event-ticker');

class AgentRouter {
  constructor() {
    // Available agents and their capabilities
    this.agents = {
      'pm-agent': {
        name: 'Project Manager',
        description: 'Orchestrating all development activities',
        capabilities: ['project-planning', 'coordination', 'risk-assessment', 'resource-allocation'],
        priority: 100
      },
      'infrastructure-devops-agent': {
        name: 'Infrastructure & DevOps',
        description: 'Railway platform expert and deployment specialist',
        capabilities: ['railway', 'deployment', 'docker', 'infrastructure', 'scaling'],
        priority: 90
      },
      'mobile-app-agent': {
        name: 'Mobile Development',
        description: 'Expo and React Native specialist with Tamagui expertise',
        capabilities: ['expo', 'react-native', 'tamagui', 'mobile', 'cross-platform'],
        priority: 85
      },
      'backend-api-agent': {
        name: 'Backend API Developer',
        description: 'Express.js and TypeScript REST API specialist',
        capabilities: ['express', 'node', 'typescript', 'api', 'rest', 'microservices'],
        priority: 85
      },
      'database-agent': {
        name: 'Database Expert',
        description: 'PostgreSQL, Prisma, and database optimization expert',
        capabilities: ['postgresql', 'prisma', 'database', 'orm', 'optimization', 'migrations'],
        priority: 80
      },
      'security-agent': {
        name: 'Security Specialist',
        description: 'Security, compliance, and threat modeling expert',
        capabilities: ['security', 'authentication', 'authorization', 'encryption', 'audit'],
        priority: 80
      },
      'test-automation-agent': {
        name: 'Test Automation',
        description: 'Jest, Supertest, and Maestro testing expert',
        capabilities: ['testing', 'jest', 'e2e', 'automation', 'quality-assurance'],
        priority: 75
      },
      'designer-agent': {
        name: 'Design Systems',
        description: 'Design systems, user experience, and accessibility',
        capabilities: ['ui', 'ux', 'design-systems', 'accessibility', 'frontend'],
        priority: 70
      },
      'auth-agent': {
        name: 'Authentication Expert',
        description: 'Clerk integration and auth flow specialist',
        capabilities: ['clerk', 'authentication', 'oauth', 'sessions', 'jwt'],
        priority: 75
      },
      'github-agent': {
        name: 'GitHub Integration',
        description: 'GitHub repository management and automation specialist',
        capabilities: ['github', 'git', 'ci-cd', 'automation', 'workflows'],
        priority: 70
      },
      'solution-architect-agent': {
        name: 'Solution Architect',
        description: 'System design and Railway platform optimization expert',
        capabilities: ['architecture', 'system-design', 'optimization', 'patterns', 'scalability'],
        priority: 95
      },
      'memory-search-agent': {
        name: 'Project Memory',
        description: 'Project memory and search specialist',
        capabilities: ['search', 'documentation', 'context', 'patterns', 'history'],
        priority: 60
      }
    };

    // MCP Server capabilities
    this.mcpServers = {
      'filesystem': {
        capabilities: ['file-operations', 'directory-management', 'search'],
        use_cases: ['all']
      },
      'context7': {
        capabilities: ['documentation', 'code-examples', 'api-references'],
        use_cases: ['learning', 'implementation', 'troubleshooting']
      },
      'railway-mcp-server': {
        capabilities: ['deployment', 'environment-management', 'scaling', 'monitoring'],
        use_cases: ['infrastructure', 'deployment', 'devops']
      },
      'github': {
        capabilities: ['repository-management', 'issues', 'pull-requests', 'workflows'],
        use_cases: ['development', 'collaboration', 'ci-cd']
      },
      'docker-mcp': {
        capabilities: ['container-management', 'image-building', 'orchestration'],
        use_cases: ['infrastructure', 'development', 'deployment']
      },
      'puppeteer': {
        capabilities: ['browser-automation', 'testing', 'scraping', 'screenshots'],
        use_cases: ['testing', 'automation', 'frontend']
      },
      'slack': {
        capabilities: ['notifications', 'team-communication', 'alerts'],
        use_cases: ['communication', 'monitoring', 'collaboration']
      }
    };
  }

  async routeTask(taskAnalysis) {
    logEvent('agent_routing_start', `Starting agent routing for ${taskAnalysis.taskId}`, taskAnalysis);

    const routing = {
      taskId: taskAnalysis.taskId,
      primaryAgent: this.selectPrimaryAgent(taskAnalysis),
      supportingAgents: this.selectSupportingAgents(taskAnalysis),
      mcpServers: this.selectMCPServers(taskAnalysis),
      workflow: this.buildWorkflow(taskAnalysis),
      confidence: this.calculateConfidence(taskAnalysis),
      reasoning: this.explainRouting(taskAnalysis),
      timestamp: new Date().toISOString()
    };

    // Add user override capability
    routing.override = {
      available: true,
      options: this.getAlternativeRoutings(taskAnalysis)
    };

    logEvent('agent_routing_complete', `Routed to ${routing.primaryAgent.name}`, routing);

    return routing;
  }

  selectPrimaryAgent(analysis) {
    const { domain, complexity, context } = analysis;
    
    // Domain-based primary agent selection
    const domainAgents = {
      infrastructure: 'infrastructure-devops-agent',
      mobile: 'mobile-app-agent',
      backend: 'backend-api-agent',
      database: 'database-agent',
      auth: 'auth-agent',
      security: 'security-agent',
      testing: 'test-automation-agent',
      frontend: 'designer-agent',
      devops: 'github-agent'
    };

    let primaryAgentId = domainAgents[domain.primary] || 'pm-agent';

    // Override for complex/epic tasks
    if (complexity === 'epic') {
      primaryAgentId = 'solution-architect-agent';
    } else if (complexity === 'complex' && domain.primary === 'infrastructure') {
      primaryAgentId = 'solution-architect-agent';
    }

    // Special cases based on context
    if (context.priority === 'P0' && domain.primary !== 'security') {
      // Keep domain expert but ensure PM oversight
    }

    const agent = this.agents[primaryAgentId];
    return {
      id: primaryAgentId,
      name: agent.name,
      description: agent.description,
      role: 'primary',
      capabilities: agent.capabilities
    };
  }

  selectSupportingAgents(analysis) {
    const supporting = [];
    const { domain, complexity, context, dependencies } = analysis;

    // Always include memory search for context
    supporting.push({
      id: 'memory-search-agent',
      name: this.agents['memory-search-agent'].name,
      role: 'context-provider',
      reason: 'Provide historical context and patterns'
    });

    // Add PM for complex coordination
    if (complexity === 'complex' || complexity === 'epic') {
      supporting.push({
        id: 'pm-agent',
        name: this.agents['pm-agent'].name,
        role: 'coordinator',
        reason: 'Coordinate complex multi-phase workflow'
      });
    }

    // Add security for sensitive domains
    if (['auth', 'backend', 'infrastructure'].includes(domain.primary) && domain.primary !== 'security') {
      supporting.push({
        id: 'security-agent',
        name: this.agents['security-agent'].name,
        role: 'security-reviewer',
        reason: 'Security review and compliance check'
      });
    }

    // Add testing for implementation tasks
    if (!['testing'].includes(domain.primary) && complexity !== 'simple') {
      supporting.push({
        id: 'test-automation-agent',
        name: this.agents['test-automation-agent'].name,
        role: 'quality-assurance',
        reason: 'Testing strategy and quality validation'
      });
    }

    // Add GitHub for code-related tasks
    if (['backend', 'frontend', 'mobile'].includes(domain.primary)) {
      supporting.push({
        id: 'github-agent',
        name: this.agents['github-agent'].name,
        role: 'version-control',
        reason: 'Code repository management and CI/CD'
      });
    }

    // Add database expert for data-heavy tasks
    if (['backend'].includes(domain.primary) && context.category !== 'database') {
      supporting.push({
        id: 'database-agent',
        name: this.agents['database-agent'].name,
        role: 'data-specialist',
        reason: 'Database design and optimization guidance'
      });
    }

    // Remove duplicates and limit to reasonable number
    const uniqueSupporting = supporting.filter((agent, index, self) => 
      index === self.findIndex(a => a.id === agent.id)
    ).slice(0, 4); // Max 4 supporting agents

    return uniqueSupporting;
  }

  selectMCPServers(analysis) {
    const { domain, complexity, context } = analysis;
    const selectedMCPs = [];

    // Always include filesystem for basic operations
    selectedMCPs.push({
      id: 'filesystem',
      reason: 'File and directory operations',
      priority: 'high'
    });

    // Domain-specific MCP selection
    const domainMCPs = {
      infrastructure: ['railway-mcp-server', 'docker-mcp', 'context7'],
      mobile: ['context7', 'github'],
      backend: ['context7', 'railway-mcp-server', 'github'],
      database: ['railway-mcp-server', 'context7'],
      auth: ['context7', 'github'],
      security: ['github', 'context7'],
      testing: ['puppeteer', 'github', 'context7'],
      frontend: ['puppeteer', 'context7', 'github'],
      devops: ['github', 'railway-mcp-server', 'docker-mcp']
    };

    const domainSpecific = domainMCPs[domain.primary] || ['context7'];
    domainSpecific.forEach(mcpId => {
      if (!selectedMCPs.find(m => m.id === mcpId)) {
        selectedMCPs.push({
          id: mcpId,
          reason: `${domain.primary} domain specialist`,
          priority: 'medium'
        });
      }
    });

    // Add communication for complex tasks
    if (complexity === 'complex' || complexity === 'epic') {
      selectedMCPs.push({
        id: 'slack',
        reason: 'Team communication and notifications',
        priority: 'low'
      });
    }

    return selectedMCPs;
  }

  buildWorkflow(analysis) {
    const { domain, complexity, dependencies } = analysis;
    
    const workflow = [
      {
        phase: 'discovery',
        description: 'Gather context and understand requirements',
        agents: ['memory-search-agent'],
        mcps: ['context7', 'filesystem'],
        estimatedDuration: complexity === 'simple' ? '5min' : '15min'
      },
      {
        phase: 'planning',
        description: 'Create execution plan and identify risks',
        agents: ['pm-agent'],
        mcps: ['context7'],
        estimatedDuration: complexity === 'simple' ? '10min' : '30min'
      },
      {
        phase: 'implementation',
        description: 'Execute the primary task work',
        agents: [], // Will be filled by primary agent
        mcps: [], // Will be filled based on domain
        estimatedDuration: this.estimateDuration(analysis)
      },
      {
        phase: 'validation',
        description: 'Test and validate the implementation',
        agents: ['test-automation-agent'],
        mcps: ['github', 'puppeteer'],
        estimatedDuration: '20min'
      }
    ];

    // Add architecture phase for complex tasks
    if (complexity === 'complex' || complexity === 'epic') {
      workflow.splice(1, 0, {
        phase: 'architecture',
        description: 'Design system architecture and patterns',
        agents: ['solution-architect-agent'],
        mcps: ['context7', 'filesystem'],
        estimatedDuration: '45min'
      });
    }

    // Add security review for sensitive domains
    if (['auth', 'security', 'backend', 'infrastructure'].includes(domain.primary)) {
      workflow.splice(-1, 0, {
        phase: 'security-review',
        description: 'Security audit and compliance check',
        agents: ['security-agent'],
        mcps: ['context7', 'github'],
        estimatedDuration: '15min'
      });
    }

    return workflow;
  }

  calculateConfidence(analysis) {
    let confidence = 0.5; // Base confidence

    // Boost confidence for clear domain classification
    if (analysis.domain.confidence > 2) confidence += 0.3;
    else if (analysis.domain.confidence > 1) confidence += 0.2;

    // Boost for well-defined tasks
    if (analysis.context.priority === 'P0') confidence += 0.1;
    if (analysis.dependencies.dependencyCount.upstream === 0) confidence += 0.1;

    // Reduce for ambiguous tasks
    if (analysis.domain.primary === 'general') confidence -= 0.2;
    if (analysis.complexity === 'epic') confidence -= 0.1;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  explainRouting(analysis) {
    const reasons = [];
    
    reasons.push(`Classified as ${analysis.domain.primary} domain with ${analysis.domain.confidence} confidence`);
    reasons.push(`Task complexity assessed as ${analysis.complexity}`);
    reasons.push(`Priority ${analysis.context.priority} with ${analysis.dependencies.dependencyCount.downstream} downstream dependencies`);
    
    if (analysis.dependencies.criticalPath) {
      reasons.push('Task is on the critical path - requires careful coordination');
    }

    return reasons;
  }

  getAlternativeRoutings(analysis) {
    // Provide 2-3 alternative agent combinations
    const alternatives = [];
    
    // PM-led alternative
    alternatives.push({
      name: 'PM-Coordinated',
      primary: 'pm-agent',
      reason: 'Let project manager coordinate all aspects',
      confidence: 0.7
    });

    // Architecture-first alternative
    if (analysis.complexity !== 'simple') {
      alternatives.push({
        name: 'Architecture-First', 
        primary: 'solution-architect-agent',
        reason: 'Start with system design and architecture',
        confidence: 0.6
      });
    }

    // Domain expert alternative (if not already primary)
    const domainAgent = this.getDomainExpert(analysis.domain.secondary);
    if (domainAgent) {
      alternatives.push({
        name: 'Secondary-Domain',
        primary: domainAgent,
        reason: `Focus on ${analysis.domain.secondary} aspects`,
        confidence: 0.5
      });
    }

    return alternatives;
  }

  getDomainExpert(domain) {
    const mapping = {
      infrastructure: 'infrastructure-devops-agent',
      mobile: 'mobile-app-agent',
      backend: 'backend-api-agent',
      database: 'database-agent',
      auth: 'auth-agent',
      security: 'security-agent',
      testing: 'test-automation-agent',
      frontend: 'designer-agent'
    };
    
    return mapping[domain];
  }

  estimateDuration(analysis) {
    const baseDurations = {
      simple: '30min',
      medium: '2hr',
      complex: '6hr',
      epic: '2days'
    };

    return baseDurations[analysis.complexity] || '1hr';
  }

  // User override functionality
  async applyOverride(routing, overrideChoice) {
    logEvent('agent_override', `User override: ${overrideChoice.name}`, { 
      original: routing.primaryAgent.id,
      override: overrideChoice.primary
    });

    // Rebuild routing with user choice
    routing.primaryAgent = {
      id: overrideChoice.primary,
      name: this.agents[overrideChoice.primary].name,
      role: 'primary-override',
      overrideReason: overrideChoice.reason
    };

    routing.confidence = overrideChoice.confidence;
    routing.userOverride = true;

    return routing;
  }
}

module.exports = AgentRouter;