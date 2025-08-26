#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ora = require('ora');
const { exec } = require('child_process');

class HTMLDashboardGenerator {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.dashboardPath = path.join(__dirname, '../tasks/dashboard.html');
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  calculateMetrics(tasks) {
    const metrics = {
      total: tasks.length,
      byStatus: {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'completed': 0
      },
      byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
      byCategory: {},
      completionRate: 0,
      blockedTasks: [],
      inProgressTasks: [],
      averageProgress: 0,
      velocity: { daily: 0, weekly: 0 }
    };

    if (tasks.length === 0) return metrics;

    tasks.forEach(task => {
      metrics.byStatus[task.status] = (metrics.byStatus[task.status] || 0) + 1;
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      metrics.byCategory[task.category] = (metrics.byCategory[task.category] || 0) + 1;
      
      if (task.status === 'blocked') {
        metrics.blockedTasks.push(task);
      }
      if (task.status === 'in-progress') {
        metrics.inProgressTasks.push(task);
      }
      
      metrics.averageProgress += task.progress || 0;
    });

    metrics.averageProgress = Math.round(metrics.averageProgress / tasks.length);
    metrics.completionRate = tasks.length > 0 
      ? (metrics.byStatus.completed / tasks.length * 100).toFixed(1) 
      : 0;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length > 0 && completedTasks[0].completed_at) {
      const dates = completedTasks.map(t => new Date(t.completed_at));
      const daysSinceFirst = (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24);
      metrics.velocity.daily = daysSinceFirst > 0 ? (completedTasks.length / daysSinceFirst).toFixed(1) : 0;
      metrics.velocity.weekly = (metrics.velocity.daily * 7).toFixed(1);
    }

    return metrics;
  }

  getNextTasks(tasks) {
    const nextTasks = {
      critical: tasks.filter(t => t.priority === 'P0' && t.status !== 'completed' && t.status !== 'blocked'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      recommended: [],
      blocked: tasks.filter(t => t.status === 'blocked'),
      blockers: []
    };

    // Find tasks ready to start
    const notStarted = tasks.filter(t => t.status === 'not-started');
    const canStart = notStarted.filter(t => {
      if (!t.dependencies?.blocked_by || t.dependencies.blocked_by.length === 0) {
        return true;
      }
      const blockers = t.dependencies.blocked_by;
      return blockers.every(blockerId => {
        const blocker = tasks.find(task => task.id === blockerId);
        return blocker && blocker.status === 'completed';
      });
    });

    nextTasks.recommended = canStart
      .sort((a, b) => {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);

    return nextTasks;
  }

  generateGanttData(tasks) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    
    const ganttTasks = tasks.map((task, index) => {
      let taskStartDate = new Date(startDate);
      taskStartDate.setDate(taskStartDate.getDate() + index * 2);
      
      let taskEndDate = new Date(taskStartDate);
      const duration = task.estimated_hours || 8;
      taskEndDate.setDate(taskEndDate.getDate() + Math.ceil(duration / 8));
      
      if (task.status === 'completed' && task.completed_at) {
        taskEndDate = new Date(task.completed_at);
        taskStartDate = new Date(taskEndDate);
        taskStartDate.setDate(taskStartDate.getDate() - Math.ceil(duration / 8));
      }
      
      return {
        id: task.id,
        title: task.title,
        start: taskStartDate.toISOString().split('T')[0],
        end: taskEndDate.toISOString().split('T')[0],
        progress: task.progress || 0,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies?.blocked_by || []
      };
    });
    
    return ganttTasks;
  }

  generateHTML(tasks, metrics, nextTasks) {
    const ganttData = this.generateGanttData(tasks);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SchoolCierge - CreaAIte Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            background: linear-gradient(135deg, #00C9A7 0%, #00B4D8 50%, #0077B6 100%);
            min-height: 100vh;
            padding: 0;
        }
        
        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            padding: 20px;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 2em;
            font-weight: bold;
            background: linear-gradient(135deg, #00C9A7, #0077B6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: flex;
            align-items: center;
        }
        
        .logo .ai {
            background: linear-gradient(135deg, #FFD60A, #FFB700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .last-updated {
            color: #718096;
            font-size: 0.9em;
        }
        
        /* Tabs */
        .tabs {
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 80px;
            z-index: 999;
        }
        
        .tab-list {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            gap: 0;
            padding: 0 20px;
        }
        
        .tab-button {
            padding: 15px 30px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            color: #718096;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
        }
        
        .tab-button:hover {
            color: #00B4D8;
            background: rgba(0, 180, 216, 0.05);
        }
        
        .tab-button.active {
            color: #0077B6;
            border-bottom-color: #00C9A7;
        }
        
        /* Content */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.5s;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #00C9A7, #00B4D8);
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        .stat-card h3 {
            color: #4a5568;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(135deg, #00C9A7, #0077B6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #718096;
            font-size: 0.9em;
        }
        
        /* Progress Bar */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00C9A7, #00B4D8);
            border-radius: 10px;
            transition: width 0.5s ease;
        }
        
        /* Task Lists */
        .task-section {
            background: white;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .task-section h2 {
            color: #2d3748;
            margin-bottom: 20px;
            font-size: 1.4em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .task-item {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
        }
        
        .task-item:hover {
            background: #f7fafc;
        }
        
        .task-item:last-child {
            border-bottom: none;
        }
        
        .task-info {
            flex: 1;
        }
        
        .task-id {
            font-weight: 600;
            color: #0077B6;
            margin-right: 10px;
        }
        
        .task-title {
            color: #2d3748;
        }
        
        .task-meta {
            display: flex;
            gap: 10px;
            margin-top: 5px;
        }
        
        .badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .priority-P0 { background: #fed7d7; color: #742a2a; }
        .priority-P1 { background: #feebc8; color: #7c2d12; }
        .priority-P2 { background: #e6fffa; color: #234e52; }
        .priority-P3 { background: #e2e8f0; color: #4a5568; }
        
        .status-completed { background: #c6f6d5; color: #22543d; }
        .status-in-progress { background: #feebc8; color: #7c2d12; }
        .status-blocked { background: #fed7d7; color: #742a2a; }
        .status-not-started { background: #e2e8f0; color: #4a5568; }
        
        /* Gantt Chart */
        .gantt-container {
            background: white;
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow-x: auto;
        }
        
        .gantt-chart {
            min-width: 1000px;
            position: relative;
        }
        
        .gantt-row {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .gantt-task-info {
            width: 250px;
            padding-right: 20px;
            font-size: 0.9em;
        }
        
        .gantt-timeline {
            flex: 1;
            position: relative;
            height: 30px;
            background: repeating-linear-gradient(
                90deg,
                #f7fafc 0,
                #f7fafc 40px,
                #fff 40px,
                #fff 80px
            );
        }
        
        .gantt-bar {
            position: absolute;
            height: 25px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            font-size: 0.75em;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .gantt-bar:hover {
            transform: scaleY(1.2);
            z-index: 10;
        }
        
        .gantt-bar.status-completed { background: linear-gradient(90deg, #48bb78, #38a169); }
        .gantt-bar.status-in-progress { background: linear-gradient(90deg, #ed8936, #dd6b20); }
        .gantt-bar.status-blocked { background: linear-gradient(90deg, #f56565, #e53e3e); }
        .gantt-bar.status-not-started { background: linear-gradient(90deg, #a0aec0, #718096); }
        
        /* What's Next Section */
        .next-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .action-card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .action-card h3 {
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        
        .command-box {
            background: #2d3748;
            color: #00C9A7;
            padding: 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin-top: 10px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .command-box:hover {
            background: #1a202c;
        }
        
        /* Category Pills */
        .category-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .category-pill {
            padding: 8px 16px;
            border-radius: 20px;
            background: linear-gradient(135deg, #e6fffa, #b2f5ea);
            color: #234e52;
            font-weight: 600;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo">
                🚀 Crea<span class="ai">AI</span>te Dashboard
            </div>
            <div class="last-updated">
                Last updated: ${new Date().toLocaleString()}
            </div>
        </div>
    </div>
    
    <div class="tabs">
        <div class="tab-list">
            <button class="tab-button active" onclick="switchTab('overview')">📊 Overview</button>
            <button class="tab-button" onclick="switchTab('next')">🎯 What's Next</button>
            <button class="tab-button" onclick="switchTab('gantt')">📅 Gantt Chart</button>
            <button class="tab-button" onclick="switchTab('tasks')">📋 All Tasks</button>
            <button class="tab-button" onclick="switchTab('analytics')">📈 Analytics</button>
        </div>
    </div>
    
    <div class="container">
        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Overall Progress</h3>
                    <div class="stat-value">${metrics.completionRate}%</div>
                    <div class="stat-label">${metrics.byStatus.completed}/${metrics.total} tasks completed</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${metrics.completionRate}%"></div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3>In Progress</h3>
                    <div class="stat-value">${metrics.byStatus['in-progress']}</div>
                    <div class="stat-label">Active tasks</div>
                </div>
                
                <div class="stat-card">
                    <h3>Blocked</h3>
                    <div class="stat-value">${metrics.byStatus.blocked}</div>
                    <div class="stat-label">Tasks blocked</div>
                </div>
                
                <div class="stat-card">
                    <h3>Daily Velocity</h3>
                    <div class="stat-value">${metrics.velocity.daily}</div>
                    <div class="stat-label">Tasks per day</div>
                </div>
            </div>
            
            ${metrics.inProgressTasks.length > 0 ? `
            <div class="task-section">
                <h2>🔄 Currently In Progress</h2>
                ${metrics.inProgressTasks.map(task => `
                    <div class="task-item">
                        <div class="task-info">
                            <span class="task-id">${task.id}</span>
                            <span class="task-title">${task.title}</span>
                            <div class="task-meta">
                                <span class="badge priority-${task.priority}">${task.priority}</span>
                                <span class="badge status-in-progress">In Progress</span>
                                <span class="badge">${task.progress || 0}% complete</span>
                            </div>
                        </div>
                        <div class="progress-bar" style="width: 150px;">
                            <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="task-section">
                <h2>📂 Categories</h2>
                <div class="category-pills">
                    ${Object.entries(metrics.byCategory).map(([cat, count]) => `
                        <div class="category-pill">
                            ${this.getCategoryIcon(cat)} ${cat}: ${count}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- What's Next Tab -->
        <div id="next" class="tab-content">
            <div class="next-actions">
                ${nextTasks.critical.length > 0 ? `
                <div class="action-card" style="border-left: 4px solid #e53e3e;">
                    <h3>🔴 Critical Tasks (P0)</h3>
                    ${nextTasks.critical.map(task => `
                        <div class="task-item">
                            <div class="task-info">
                                <span class="task-id">${task.id}</span>
                                <span class="task-title">${task.title}</span>
                            </div>
                        </div>
                        <div class="command-box" onclick="copyCommand('cx start ${task.id}')">
                            $ cx start ${task.id}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${nextTasks.recommended.length > 0 ? `
                <div class="action-card" style="border-left: 4px solid #48bb78;">
                    <h3>✨ Recommended Next</h3>
                    ${nextTasks.recommended.map(task => `
                        <div class="task-item">
                            <div class="task-info">
                                <span class="task-id">${task.id}</span>
                                <span class="task-title">${task.title}</span>
                                <div class="task-meta">
                                    <span class="badge priority-${task.priority}">${task.priority}</span>
                                </div>
                            </div>
                        </div>
                        <div class="command-box" onclick="copyCommand('cx start ${task.id}')">
                            $ cx start ${task.id}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            
            ${nextTasks.blocked.length > 0 ? `
            <div class="task-section">
                <h2>🚧 Blocked Tasks</h2>
                ${nextTasks.blocked.map(task => `
                    <div class="task-item">
                        <div class="task-info">
                            <span class="task-id">${task.id}</span>
                            <span class="task-title">${task.title}</span>
                            <div class="task-meta">
                                <span class="badge status-blocked">Blocked</span>
                                ${task.dependencies?.blocked_by ? `
                                <span class="badge">Blocked by: ${task.dependencies.blocked_by.join(', ')}</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <!-- Gantt Chart Tab -->
        <div id="gantt" class="tab-content">
            <div class="gantt-container">
                <h2>📅 Project Timeline</h2>
                <div class="gantt-chart">
                    ${ganttData.slice(0, 20).map(task => `
                        <div class="gantt-row">
                            <div class="gantt-task-info">
                                <strong>${task.id}</strong>: ${task.title.substring(0, 30)}
                            </div>
                            <div class="gantt-timeline">
                                <div class="gantt-bar status-${task.status}" 
                                     style="left: ${this.calculateGanttPosition(task.start)}%; 
                                            width: ${this.calculateGanttWidth(task.start, task.end)}%;"
                                     title="${task.title} (${task.start} to ${task.end})">
                                    ${task.progress}%
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- All Tasks Tab -->
        <div id="tasks" class="tab-content">
            <div class="task-section">
                <h2>📋 All Tasks</h2>
                ${tasks.map(task => `
                    <div class="task-item">
                        <div class="task-info">
                            <span class="task-id">${task.id}</span>
                            <span class="task-title">${task.title}</span>
                            <div class="task-meta">
                                <span class="badge priority-${task.priority}">${task.priority}</span>
                                <span class="badge status-${task.status}">${task.status.replace('-', ' ')}</span>
                                <span class="badge">${task.category}</span>
                                ${task.progress ? `<span class="badge">${task.progress}%</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Analytics Tab -->
        <div id="analytics" class="tab-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Average Progress</h3>
                    <div class="stat-value">${metrics.averageProgress}%</div>
                    <div class="stat-label">Across all tasks</div>
                </div>
                
                <div class="stat-card">
                    <h3>Weekly Velocity</h3>
                    <div class="stat-value">${metrics.velocity.weekly}</div>
                    <div class="stat-label">Tasks per week</div>
                </div>
                
                <div class="stat-card">
                    <h3>Priority Distribution</h3>
                    <div style="margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>P0</span>
                            <strong>${metrics.byPriority.P0 || 0}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>P1</span>
                            <strong>${metrics.byPriority.P1 || 0}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>P2</span>
                            <strong>${metrics.byPriority.P2 || 0}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>P3</span>
                            <strong>${metrics.byPriority.P3 || 0}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3>Status Breakdown</h3>
                    <div style="margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Completed</span>
                            <strong style="color: #22543d;">${metrics.byStatus.completed}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>In Progress</span>
                            <strong style="color: #7c2d12;">${metrics.byStatus['in-progress']}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Blocked</span>
                            <strong style="color: #742a2a;">${metrics.byStatus.blocked}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                            <span>Not Started</span>
                            <strong style="color: #4a5568;">${metrics.byStatus['not-started']}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function switchTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Mark button as active
            event.target.classList.add('active');
        }
        
        function copyCommand(command) {
            navigator.clipboard.writeText(command).then(() => {
                // Show feedback
                const el = event.target;
                const originalText = el.innerText;
                el.innerText = '✓ Copied!';
                el.style.background = '#48bb78';
                
                setTimeout(() => {
                    el.innerText = originalText;
                    el.style.background = '';
                }, 1500);
            });
        }
        
        // Auto-refresh every 60 seconds
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>`;
  }

  getCategoryIcon(category) {
    const icons = {
      infrastructure: '🏗️',
      authentication: '🔐',
      backend: '⚙️',
      integration: '🔌',
      mobile: '📱',
      devops: '🚀',
      clara: '🤖',
      timer: '⏱️',
      adapt: '🎯',
      admin: '👤',
      frontend: '🎨',
      database: '💾',
      security: '🔒',
      testing: '🧪'
    };
    return icons[category.toLowerCase()] || '📦';
  }

  calculateGanttPosition(startDate) {
    // Simplified calculation - in production would be based on actual timeline
    return Math.random() * 20;
  }

  calculateGanttWidth(startDate, endDate) {
    // Simplified calculation - in production would be based on actual dates
    return 10 + Math.random() * 20;
  }

  async run() {
    const spinner = ora({
      text: 'Generating HTML dashboard...',
      spinner: 'dots',
      color: 'cyan'
    }).start();

    try {
      const tasks = this.loadTasks();
      const metrics = this.calculateMetrics(tasks);
      const nextTasks = this.getNextTasks(tasks);
      
      const html = this.generateHTML(tasks, metrics, nextTasks);
      
      fs.writeFileSync(this.dashboardPath, html);
      
      spinner.succeed('✅ Dashboard generated successfully!');
      
      console.log(`\n📊 Dashboard saved to: ${this.dashboardPath}`);
      console.log(`🌐 Open in browser: file://${path.resolve(this.dashboardPath)}`);
      
      // Try to open in default browser
      const openCommand = process.platform === 'darwin' ? 'open' :
                         process.platform === 'win32' ? 'start' : 'xdg-open';
      
      exec(`${openCommand} "${path.resolve(this.dashboardPath)}"`, (err) => {
        if (!err) {
          console.log('\n✨ Dashboard opened in your browser!');
        }
      });
      
    } catch (error) {
      spinner.fail('Failed to generate dashboard');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the generator
const generator = new HTMLDashboardGenerator();
generator.run();