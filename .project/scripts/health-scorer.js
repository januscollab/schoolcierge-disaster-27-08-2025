#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TaskHealthScorer {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.eventsPath = path.join(__dirname, '../tasks/events.jsonl');
    
    // Scoring weights (must sum to 1.0)
    this.weights = {
      progressVelocity: 0.20,
      implementation: 0.25,
      dependencies: 0.15,
      timeEfficiency: 0.15,
      blockageRisk: 0.10,
      communication: 0.10,
      quality: 0.05
    };
  }

  calculateHealthScore(task) {
    const scores = {
      progressVelocity: this.scoreProgressVelocity(task),
      implementation: this.scoreImplementation(task),
      dependencies: this.scoreDependencies(task),
      timeEfficiency: this.scoreTimeEfficiency(task),
      blockageRisk: this.scoreBlockageRisk(task),
      communication: this.scoreCommunication(task),
      quality: this.scoreQuality(task)
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += score * this.weights[factor];
    }

    return {
      overall: Math.round(totalScore),
      breakdown: scores,
      status: this.getHealthStatus(totalScore),
      trend: this.calculateTrend(task),
      recommendations: this.generateRecommendations(scores)
    };
  }

  scoreProgressVelocity(task) {
    if (task.status === 'not-started') return 100;
    if (task.status === 'completed') return 100;
    
    const age = this.getTaskAgeInHours(task);
    if (age === 0) return 100;
    
    const expectedProgress = Math.min(100, age * 2); // 2% per hour expected
    const actualProgress = task.progress || 0;
    
    const velocity = (actualProgress / expectedProgress) * 100;
    return Math.min(100, Math.max(0, velocity));
  }

  scoreImplementation(task) {
    if (task.status === 'not-started') return 100;
    
    // If task is verified, trust it completely
    if (task.implementation_notes?.verified === true) {
      return 100;
    }
    
    // For completed tasks, be more lenient
    if (task.status === 'completed') {
      // If it was completed and has do_not_revert flag, trust it
      if (task.implementation_notes?.do_not_revert === true) {
        return 100;
      }
      // If completed with 100% progress, assume implementation exists
      if (task.progress === 100) {
        return 90;
      }
      // Check for actual files
      const hasFiles = (task.implementation_notes?.files_created?.length || 0) +
                       (task.implementation_notes?.files_modified?.length || 0);
      return hasFiles > 0 ? 100 : 20;
    }
    
    // For in-progress tasks
    const hasFiles = (task.implementation_notes?.files_created?.length || 0) +
                     (task.implementation_notes?.files_modified?.length || 0);
    
    const expectedFiles = (task.implementation_notes?.files_to_create?.length || 1) +
                         (task.implementation_notes?.files_to_modify?.length || 0);
    
    const implementationRatio = hasFiles / Math.max(1, expectedFiles);
    const progressAlignment = Math.abs(implementationRatio - (task.progress / 100));
    
    return Math.max(0, 100 - (progressAlignment * 100));
  }

  scoreDependencies(task) {
    if (!task.dependencies?.blocked_by?.length) return 100;
    
    const tasks = this.loadAllTasks();
    const blockers = task.dependencies.blocked_by;
    
    let blockingScore = 100;
    for (const blockerId of blockers) {
      const blocker = tasks.find(t => t.id === blockerId);
      if (!blocker) continue;
      
      if (blocker.status === 'completed') {
        // Shouldn't be blocking
        blockingScore -= 20;
      } else if (blocker.status === 'not-started') {
        // High risk
        blockingScore -= 30;
      } else if (blocker.progress < 50) {
        // Medium risk
        blockingScore -= 15;
      }
    }
    
    return Math.max(0, blockingScore);
  }

  scoreTimeEfficiency(task) {
    if (task.status === 'not-started') return 100;
    if (!task.estimates?.effort_hours) return 75; // No estimate
    
    const actualHours = this.getTaskAgeInHours(task);
    const estimatedHours = parseFloat(task.estimates.effort_hours);
    
    if (task.status === 'completed') {
      const efficiency = estimatedHours / Math.max(1, actualHours);
      return Math.min(100, efficiency * 100);
    }
    
    // For in-progress
    const expectedProgress = Math.min(100, (actualHours / estimatedHours) * 100);
    const actualProgress = task.progress || 0;
    
    const efficiency = actualProgress / Math.max(1, expectedProgress);
    return Math.min(100, Math.max(0, efficiency * 100));
  }

  scoreBlockageRisk(task) {
    let riskScore = 100;
    
    // Check for stuck patterns
    const lastUpdate = this.getHoursSinceLastUpdate(task);
    if (lastUpdate > 24) riskScore -= 20;
    if (lastUpdate > 72) riskScore -= 30;
    
    // Check for no progress start
    if (task.status === 'in-progress' && task.progress === 0) {
      const age = this.getTaskAgeInHours(task);
      if (age > 4) riskScore -= 25;
    }
    
    // Check for stalled progress
    const progressHistory = this.getProgressHistory(task);
    if (progressHistory.stalled) riskScore -= 30;
    
    return Math.max(0, riskScore);
  }

  scoreCommunication(task) {
    const events = this.getTaskEvents(task);
    const age = Math.max(1, this.getTaskAgeInHours(task));
    
    // Expect at least 1 update per 24 hours
    const expectedUpdates = Math.floor(age / 24);
    const actualUpdates = events.length;
    
    const ratio = actualUpdates / Math.max(1, expectedUpdates);
    return Math.min(100, ratio * 100);
  }

  scoreQuality(task) {
    let qualityScore = 100;
    
    // Check for test files
    const hasTests = this.checkForTests(task);
    if (!hasTests && task.progress > 50) qualityScore -= 25;
    
    // Check for documentation
    const hasDocs = this.checkForDocs(task);
    if (!hasDocs && task.progress > 75) qualityScore -= 15;
    
    // Check for error patterns in events
    const events = this.getTaskEvents(task);
    const errorCount = events.filter(e => e.type?.includes('error')).length;
    qualityScore -= (errorCount * 10);
    
    return Math.max(0, qualityScore);
  }

  getHealthStatus(score) {
    if (score >= 95) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  // Helper methods
  getTaskAgeInHours(task) {
    if (!task.started_at) return 0;
    return (Date.now() - new Date(task.started_at).getTime()) / (1000 * 60 * 60);
  }

  getHoursSinceLastUpdate(task) {
    const lastUpdate = task.updated_at || task.started_at;
    if (!lastUpdate) return 0;
    return (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);
  }

  loadAllTasks() {
    try {
      return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
    } catch {
      return [];
    }
  }

  getTaskEvents(task) {
    try {
      const events = fs.readFileSync(this.eventsPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .filter(e => e.data?.taskId === task.id);
      return events;
    } catch {
      return [];
    }
  }

  getProgressHistory(task) {
    const events = this.getTaskEvents(task);
    const progressEvents = events.filter(e => e.type === 'progress_update');
    
    if (progressEvents.length < 2) {
      return { stalled: false, velocity: 0 };
    }
    
    // Check if progress has stalled
    const recentProgress = progressEvents.slice(-5);
    const uniqueProgress = [...new Set(recentProgress.map(e => e.data.progress))];
    
    return {
      stalled: uniqueProgress.length === 1 && progressEvents.length > 3,
      velocity: this.calculateVelocity(progressEvents)
    };
  }

  calculateVelocity(events) {
    if (events.length < 2) return 0;
    
    const first = events[0];
    const last = events[events.length - 1];
    
    const progressDiff = (last.data?.progress || 0) - (first.data?.progress || 0);
    const timeDiff = new Date(last.timestamp) - new Date(first.timestamp);
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 0 ? progressDiff / hoursDiff : 0;
  }

  calculateTrend(task) {
    const events = this.getTaskEvents(task);
    const recentEvents = events.slice(-10);
    
    if (recentEvents.length < 3) return 'stable';
    
    // Analyze trend
    const scores = recentEvents.map(e => e.data?.healthScore || 0);
    const avgFirst = scores.slice(0, Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0) / Math.floor(scores.length / 2);
    const avgSecond = scores.slice(Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0) / (scores.length - Math.floor(scores.length / 2));
    
    if (avgSecond > avgFirst + 5) return 'improving';
    if (avgSecond < avgFirst - 5) return 'declining';
    return 'stable';
  }

  generateRecommendations(scores) {
    const recommendations = [];
    
    if (scores.progressVelocity < 50) {
      recommendations.push({
        type: 'velocity',
        priority: 'high',
        message: 'Task progress is slower than expected',
        action: 'Consider breaking down into smaller subtasks or getting help'
      });
    }
    
    if (scores.implementation < 30) {
      recommendations.push({
        type: 'implementation',
        priority: 'critical',
        message: 'No implementation evidence found',
        action: 'Start creating the required files or update implementation notes'
      });
    }
    
    if (scores.dependencies < 50) {
      recommendations.push({
        type: 'dependencies',
        priority: 'high',
        message: 'Blocked by incomplete dependencies',
        action: 'Review and prioritize blocking tasks'
      });
    }
    
    if (scores.communication < 50) {
      recommendations.push({
        type: 'communication',
        priority: 'medium',
        message: 'Insufficient status updates',
        action: 'Provide regular progress updates to maintain visibility'
      });
    }
    
    return recommendations;
  }

  checkForTests(task) {
    const testPatterns = ['test', 'spec', '__tests__'];
    const files = [
      ...(task.implementation_notes?.files_created || []),
      ...(task.implementation_notes?.files_modified || [])
    ];
    
    return files.some(file => 
      testPatterns.some(pattern => file.toLowerCase().includes(pattern))
    );
  }

  checkForDocs(task) {
    const docPatterns = ['readme', 'docs', '.md', 'documentation'];
    const files = [
      ...(task.implementation_notes?.files_created || []),
      ...(task.implementation_notes?.files_modified || [])
    ];
    
    return files.some(file => 
      docPatterns.some(pattern => file.toLowerCase().includes(pattern))
    );
  }
}

module.exports = TaskHealthScorer;