#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// const { Task } = require('../../src/task-tool'); // TODO: Implement when Task tool is ready
const { logEvent } = require('../event-ticker');

class WorkflowOrchestrator {
  constructor() {
    this.accPath = path.join(__dirname, '../../tasks/agent-conversations.jsonl');
    this.activeWorkflows = new Map();
    this.failureStrategies = {
      retry: { maxAttempts: 3, backoff: 1000 },
      fallback: { enabled: true },
      escalation: { enabled: true },
      userNotification: { threshold: 'medium' }
    };
  }

  async executeWorkflow(taskId, routing) {
    const workflowId = this.generateWorkflowId(taskId);
    
    const workflow = {
      id: workflowId,
      taskId,
      routing,
      startTime: Date.now(),
      status: 'initializing',
      currentPhase: null,
      phases: routing.workflow,
      results: {},
      agentConversations: [],
      errors: [],
      metadata: {
        confidence: routing.confidence,
        estimatedDuration: this.calculateTotalDuration(routing.workflow),
        complexity: routing.workflow.length > 4 ? 'complex' : 'standard'
      }
    };

    this.activeWorkflows.set(workflowId, workflow);

    logEvent('workflow_started', `Started workflow ${workflowId} for ${taskId}`, {
      workflowId,
      taskId,
      primaryAgent: routing.primaryAgent.name,
      phases: workflow.phases.length,
      estimatedDuration: workflow.metadata.estimatedDuration
    });

    try {
      await this.initializeAgentConversationChannel(workflowId);
      workflow.status = 'running';
      
      // Execute phases sequentially
      for (const [index, phase] of workflow.phases.entries()) {
        workflow.currentPhase = index;
        const phaseResult = await this.executePhase(workflow, phase, index);
        workflow.results[phase.phase] = phaseResult;
        
        // Check for critical failures
        if (phaseResult.status === 'failed' && phaseResult.critical) {
          throw new Error(`Critical failure in ${phase.phase} phase: ${phaseResult.error}`);
        }
      }

      workflow.status = 'completed';
      workflow.endTime = Date.now();
      workflow.actualDuration = workflow.endTime - workflow.startTime;

      logEvent('workflow_completed', `Completed workflow ${workflowId}`, {
        workflowId,
        taskId,
        duration: workflow.actualDuration,
        phases: Object.keys(workflow.results).length,
        success: true
      });

      return workflow;

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.endTime = Date.now();
      
      logEvent('workflow_failed', `Workflow ${workflowId} failed`, {
        workflowId,
        taskId,
        error: error.message,
        phase: workflow.currentPhase,
        duration: workflow.endTime - workflow.startTime
      });

      // Handle failure with user notification
      await this.handleWorkflowFailure(workflow, error);
      
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  async executePhase(workflow, phase, phaseIndex) {
    const phaseId = `${workflow.id}-phase-${phaseIndex}`;
    const startTime = Date.now();

    logEvent('phase_start', `Starting ${phase.phase} phase`, {
      workflowId: workflow.id,
      taskId: workflow.taskId,
      phase: phase.phase,
      agents: phase.agents,
      mcps: phase.mcps,
      phaseIndex
    });

    const phaseResult = {
      phase: phase.phase,
      status: 'running',
      startTime,
      agents: phase.agents || [],
      mcps: phase.mcps || [],
      outputs: {},
      agentInteractions: [],
      errors: []
    };

    try {
      // Execute phase with retry logic
      const result = await this.executePhaseWithRetry(workflow, phase, phaseIndex);
      phaseResult.outputs = result.outputs;
      phaseResult.agentInteractions = result.agentInteractions;
      phaseResult.status = 'completed';

      logEvent('phase_completed', `Completed ${phase.phase} phase`, {
        workflowId: workflow.id,
        phase: phase.phase,
        duration: Date.now() - startTime,
        outputs: Object.keys(result.outputs).length,
        interactions: result.agentInteractions.length
      });

    } catch (error) {
      phaseResult.status = 'failed';
      phaseResult.error = error.message;
      phaseResult.errors.push({
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      });

      // Determine if failure is critical
      phaseResult.critical = this.isPhaseFailureCritical(phase, error);

      logEvent('phase_failed', `Failed ${phase.phase} phase`, {
        workflowId: workflow.id,
        phase: phase.phase,
        error: error.message,
        critical: phaseResult.critical,
        duration: Date.now() - startTime
      });

      // Try fallback strategies
      if (!phaseResult.critical) {
        const fallbackResult = await this.attemptPhaseFallback(workflow, phase, error);
        if (fallbackResult.success) {
          phaseResult.status = 'completed-with-fallback';
          phaseResult.outputs = fallbackResult.outputs;
          phaseResult.fallbackUsed = fallbackResult.strategy;
        }
      }
    }

    phaseResult.endTime = Date.now();
    phaseResult.duration = phaseResult.endTime - startTime;

    return phaseResult;
  }

  async executePhaseWithRetry(workflow, phase, phaseIndex) {
    const maxAttempts = this.failureStrategies.retry.maxAttempts;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logEvent('phase_attempt', `Phase ${phase.phase} attempt ${attempt}/${maxAttempts}`, {
          workflowId: workflow.id,
          phase: phase.phase,
          attempt
        });

        return await this.executeSinglePhaseAttempt(workflow, phase, phaseIndex);

      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const backoffDelay = this.failureStrategies.retry.backoff * attempt;
          logEvent('phase_retry', `Retrying ${phase.phase} in ${backoffDelay}ms`, {
            workflowId: workflow.id,
            phase: phase.phase,
            attempt,
            error: error.message,
            nextAttemptIn: backoffDelay
          });
          
          await this.sleep(backoffDelay);
        }
      }
    }

    throw lastError;
  }

  async executeSinglePhaseAttempt(workflow, phase, phaseIndex) {
    const result = {
      outputs: {},
      agentInteractions: []
    };

    // Simulate agent execution with Task tool
    // In real implementation, this would use the actual Task tool to call agents
    
    const phaseAgents = phase.agents || [workflow.routing.primaryAgent.id];
    const phaseMCPs = phase.mcps || ['filesystem'];

    for (const agentId of phaseAgents) {
      const agentStartTime = Date.now();
      
      logEvent('agent_start', `Starting ${agentId} for ${phase.phase}`, {
        workflowId: workflow.id,
        phase: phase.phase,
        agent: agentId,
        mcps: phaseMCPs
      });

      // Record agent conversation
      await this.recordAgentConversation(workflow.id, {
        phase: phase.phase,
        agent: agentId,
        type: 'execution_start',
        timestamp: Date.now(),
        context: {
          taskId: workflow.taskId,
          mcps: phaseMCPs,
          previousOutputs: Object.keys(result.outputs)
        }
      });

      try {
        // Simulate agent work with appropriate MCP servers
        const agentResult = await this.simulateAgentWork(agentId, phase, phaseMCPs, workflow);
        
        result.outputs[agentId] = agentResult;
        result.agentInteractions.push({
          agent: agentId,
          duration: Date.now() - agentStartTime,
          status: 'success',
          outputs: Object.keys(agentResult)
        });

        await this.recordAgentConversation(workflow.id, {
          phase: phase.phase,
          agent: agentId,
          type: 'execution_success',
          timestamp: Date.now(),
          result: agentResult,
          duration: Date.now() - agentStartTime
        });

        logEvent('agent_completed', `Completed ${agentId} for ${phase.phase}`, {
          workflowId: workflow.id,
          phase: phase.phase,
          agent: agentId,
          duration: Date.now() - agentStartTime,
          outputKeys: Object.keys(agentResult)
        });

      } catch (error) {
        await this.recordAgentConversation(workflow.id, {
          phase: phase.phase,
          agent: agentId,
          type: 'execution_error',
          timestamp: Date.now(),
          error: error.message,
          duration: Date.now() - agentStartTime
        });

        logEvent('agent_failed', `Failed ${agentId} for ${phase.phase}`, {
          workflowId: workflow.id,
          phase: phase.phase,
          agent: agentId,
          error: error.message,
          duration: Date.now() - agentStartTime
        });

        throw error;
      }
    }

    return result;
  }

  async simulateAgentWork(agentId, phase, mcps, workflow) {
    // Simulate different types of agent work based on phase and agent type
    const workDuration = Math.random() * 2000 + 1000; // 1-3 seconds
    await this.sleep(workDuration);

    const baseResult = {
      agent: agentId,
      phase: phase.phase,
      timestamp: Date.now(),
      duration: workDuration
    };

    // Add phase-specific outputs
    switch (phase.phase) {
      case 'discovery':
        return {
          ...baseResult,
          context: { 
            relatedTasks: Math.floor(Math.random() * 5),
            patterns: ['pattern1', 'pattern2'],
            documentation: ['doc1.md', 'doc2.md']
          }
        };
      
      case 'planning':
        return {
          ...baseResult,
          plan: {
            steps: ['step1', 'step2', 'step3'],
            risks: ['risk1', 'risk2'],
            resources: ['resource1']
          }
        };
      
      case 'implementation':
        return {
          ...baseResult,
          implementation: {
            filesModified: ['file1.js', 'file2.js'],
            linesAdded: Math.floor(Math.random() * 200),
            testsCreated: Math.floor(Math.random() * 10)
          }
        };
      
      case 'validation':
        return {
          ...baseResult,
          validation: {
            testsRun: Math.floor(Math.random() * 20) + 5,
            testsPassed: Math.floor(Math.random() * 20) + 5,
            coverage: Math.floor(Math.random() * 40) + 60
          }
        };
      
      default:
        return baseResult;
    }
  }

  async initializeAgentConversationChannel(workflowId) {
    const acc = {
      workflowId,
      timestamp: Date.now(),
      type: 'channel_initialized',
      participants: [],
      metadata: {
        purpose: 'Multi-agent workflow coordination',
        format: 'jsonl'
      }
    };

    await this.recordAgentConversation(workflowId, acc);
  }

  async recordAgentConversation(workflowId, conversation) {
    const record = {
      workflowId,
      timestamp: conversation.timestamp || Date.now(),
      ...conversation
    };

    try {
      fs.appendFileSync(this.accPath, JSON.stringify(record) + '\n');
    } catch (error) {
      // Fallback to event ticker if ACC fails
      logEvent('acc_write_failed', `Failed to write to ACC: ${error.message}`, {
        workflowId,
        conversation: conversation.type
      });
    }
  }

  isPhaseFailureCritical(phase, error) {
    const criticalPhases = ['implementation', 'security-review'];
    const criticalErrors = ['authentication', 'database', 'syntax'];
    
    if (criticalPhases.includes(phase.phase)) return true;
    
    const errorMessage = error.message.toLowerCase();
    return criticalErrors.some(critical => errorMessage.includes(critical));
  }

  async attemptPhaseFallback(workflow, phase, error) {
    logEvent('fallback_attempt', `Attempting fallback for ${phase.phase}`, {
      workflowId: workflow.id,
      phase: phase.phase,
      originalError: error.message
    });

    // Fallback strategies by phase type
    const fallbacks = {
      'discovery': async () => {
        // Use basic file search instead of advanced context
        return { outputs: { fallback: 'basic-search' }, strategy: 'basic-discovery' };
      },
      'planning': async () => {
        // Use template-based planning
        return { outputs: { fallback: 'template-plan' }, strategy: 'template-planning' };
      },
      'validation': async () => {
        // Skip advanced validation, use basic checks
        return { outputs: { fallback: 'basic-validation' }, strategy: 'basic-validation' };
      }
    };

    const fallbackFn = fallbacks[phase.phase];
    if (fallbackFn) {
      try {
        const result = await fallbackFn();
        logEvent('fallback_success', `Fallback successful for ${phase.phase}`, {
          workflowId: workflow.id,
          strategy: result.strategy
        });
        return { success: true, ...result };
      } catch (fallbackError) {
        logEvent('fallback_failed', `Fallback failed for ${phase.phase}`, {
          workflowId: workflow.id,
          error: fallbackError.message
        });
      }
    }

    return { success: false };
  }

  async handleWorkflowFailure(workflow, error) {
    const failureReport = {
      workflowId: workflow.id,
      taskId: workflow.taskId,
      error: error.message,
      phase: workflow.currentPhase,
      duration: workflow.endTime - workflow.startTime,
      completedPhases: Object.keys(workflow.results).length,
      totalPhases: workflow.phases.length,
      agentConversations: workflow.agentConversations.length,
      possibleSolutions: await this.generateFailureSolutions(workflow, error)
    };

    logEvent('workflow_failure_report', 'Workflow failure analysis complete', failureReport);

    // Notify user about failure and proposed solutions
    console.log('\n🚨 WORKFLOW FAILURE DETECTED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Task: ${workflow.taskId}`);
    console.log(`Failed at: ${workflow.phases[workflow.currentPhase]?.phase || 'unknown'} phase`);
    console.log(`Error: ${error.message}`);
    console.log('\n💡 Proposed Solutions:');
    failureReport.possibleSolutions.forEach((solution, index) => {
      console.log(`${index + 1}. ${solution.description}`);
      console.log(`   Confidence: ${solution.confidence}%`);
      console.log(`   Action: ${solution.action}\n`);
    });

    return failureReport;
  }

  async generateFailureSolutions(workflow, error) {
    const solutions = [];

    // Analyze error type and suggest solutions
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('agent') || errorMessage.includes('routing')) {
      solutions.push({
        description: 'Try alternative agent routing',
        confidence: 80,
        action: `cx build ${workflow.taskId} --override-agent`,
        type: 'agent-override'
      });
    }

    if (errorMessage.includes('mcp') || errorMessage.includes('server')) {
      solutions.push({
        description: 'Retry with different MCP servers',
        confidence: 70,
        action: `cx build ${workflow.taskId} --fallback-mcps`,
        type: 'mcp-fallback'
      });
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      solutions.push({
        description: 'Retry with extended timeout',
        confidence: 85,
        action: `cx build ${workflow.taskId} --extended-timeout`,
        type: 'timeout-extension'
      });
    }

    // Always include manual override option
    solutions.push({
      description: 'Switch to manual task execution',
      confidence: 95,
      action: `cx build ${workflow.taskId} --manual`,
      type: 'manual-override'
    });

    return solutions;
  }

  calculateTotalDuration(phases) {
    return phases.reduce((total, phase) => {
      const duration = this.parseDuration(phase.estimatedDuration || '30min');
      return total + duration;
    }, 0);
  }

  parseDuration(durationString) {
    const minutes = durationString.match(/(\d+)min/)?.[1] || 0;
    const hours = durationString.match(/(\d+)hr/)?.[1] || 0;
    const days = durationString.match(/(\d+)day/)?.[1] || 0;
    
    return (parseInt(days) * 24 * 60) + (parseInt(hours) * 60) + parseInt(minutes);
  }

  generateWorkflowId(taskId) {
    return `workflow-${taskId}-${Date.now()}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public interface for monitoring workflows
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }
}

module.exports = WorkflowOrchestrator;