#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StatusReporter {
  constructor() {
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.progressPath = path.join(__dirname, '../tasks/PROGRESS.md');
    this.dashboardPath = path.join(__dirname, '../tasks/dashboard.html');
  }

  loadTasks() {
    if (!fs.existsSync(this.tasksPath)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
  }

  calculateMetrics() {
    const tasks = this.loadTasks();
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
      criticalPathHealth: 'on-track',
      velocity: {
        daily: 0,
        weekly: 0
      }
    };

    if (tasks.length === 0) {
      return metrics;
    }

    tasks.forEach(task => {
      // Count by status
      metrics.byStatus[task.status] = (metrics.byStatus[task.status] || 0) + 1;
      
      // Count by priority
      metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      
      // Count by category
      metrics.byCategory[task.category] = (metrics.byCategory[task.category] || 0) + 1;
      
      // Track blocked tasks
      if (task.status === 'blocked') {
        metrics.blockedTasks.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies.blocked_by
        });
      }
      
      // Track in-progress tasks
      if (task.status === 'in-progress') {
        metrics.inProgressTasks.push({
          id: task.id,
          title: task.title,
          progress: task.progress
        });
      }
      
      // Calculate average progress
      metrics.averageProgress += task.progress || 0;
    });

    metrics.averageProgress = Math.round(metrics.averageProgress / tasks.length);
    metrics.completionRate = tasks.length > 0 
      ? (metrics.byStatus.completed / tasks.length * 100).toFixed(1) 
      : 0;

    // Calculate velocity (simplified)
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length > 0) {
      const dates = completedTasks.map(t => new Date(t.completed_at));
      const daysSinceFirst = (Date.now() - Math.min(...dates)) / (1000 * 60 * 60 * 24);
      metrics.velocity.daily = daysSinceFirst > 0 ? (completedTasks.length / daysSinceFirst).toFixed(1) : 0;
      metrics.velocity.weekly = metrics.velocity.daily * 7;
    }

    return metrics;
  }

  generateProgressBar(percentage, width = 20) {
    const filled = Math.round(width * percentage / 100);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  }

  generateMarkdownReport(metrics) {
    const now = new Date().toISOString().split('T')[0];
    
    return `# 📊 SchoolCierge Development Progress

*Last Updated: ${now} | Auto-generated*

## 🎯 Overall Progress: ${metrics.completionRate}% Complete (${metrics.byStatus.completed}/${metrics.total} tasks)

\`\`\`
${this.generateProgressBar(parseFloat(metrics.completionRate))}
\`\`\`

## 📈 Progress by Status

| Status | Count | Visual |
|--------|-------|--------|
| ✅ Completed | ${metrics.byStatus.completed} | ${this.generateProgressBar(metrics.byStatus.completed / Math.max(metrics.total, 1) * 100, 10)} |
| 🔄 In Progress | ${metrics.byStatus['in-progress']} | ${this.generateProgressBar(metrics.byStatus['in-progress'] / Math.max(metrics.total, 1) * 100, 10)} |
| 🚫 Blocked | ${metrics.byStatus.blocked} | ${this.generateProgressBar(metrics.byStatus.blocked / Math.max(metrics.total, 1) * 100, 10)} |
| ⭕ Not Started | ${metrics.byStatus['not-started']} | ${this.generateProgressBar(metrics.byStatus['not-started'] / Math.max(metrics.total, 1) * 100, 10)} |

## 📊 Priority Breakdown

- **P0 (Critical)**: ${metrics.byPriority.P0}
- **P1 (High)**: ${metrics.byPriority.P1}
- **P2 (Medium)**: ${metrics.byPriority.P2}
- **P3 (Low)**: ${metrics.byPriority.P3}

${metrics.inProgressTasks.length > 0 ? `
## 🔄 Currently In Progress

${metrics.inProgressTasks.map(t => 
  `- **${t.id}**: ${t.title} (${t.progress}% complete)`
).join('\\n')}
` : ''}

${metrics.blockedTasks.length > 0 ? `
## 🚧 Blocked Tasks

${metrics.blockedTasks.map(t => 
  `- **${t.id}**: ${t.title}\\n  - Blocked by: ${t.blockedBy.join(', ')}`
).join('\\n')}
` : ''}

## 🎖️ Velocity Metrics

- **Daily Average**: ${metrics.velocity.daily} tasks/day
- **Weekly Rate**: ${metrics.velocity.weekly} tasks/week
- **Average Progress**: ${metrics.averageProgress}%

## 📂 Categories

${Object.entries(metrics.byCategory).map(([cat, count]) => 
  `- **${cat}**: ${count} tasks`
).join('\\n')}
`;
  }

  generateHTMLDashboard(metrics) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SchoolCierge - Project Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto;
        }
        h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-card h3 {
            color: #4a5568;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #718096;
            font-size: 0.9em;
        }
        .progress-ring {
            width: 150px;
            height: 150px;
            margin: 0 auto;
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: #e2e8f0;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #48bb78, #38a169);
            border-radius: 15px;
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
        }
        .task-list {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 20px;
        }
        .task-item {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .task-item:last-child {
            border-bottom: none;
        }
        .status-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-completed { background: #c6f6d5; color: #22543d; }
        .status-in-progress { background: #feebc8; color: #7c2d12; }
        .status-blocked { background: #fed7d7; color: #742a2a; }
        .status-not-started { background: #e2e8f0; color: #4a5568; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SchoolCierge Project Dashboard</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Overall Progress</h3>
                <div class="stat-value">${metrics.completionRate}%</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${metrics.completionRate}%">
                        ${metrics.byStatus.completed}/${metrics.total}
                    </div>
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
                <h3>Velocity</h3>
                <div class="stat-value">${metrics.velocity.daily}</div>
                <div class="stat-label">Tasks per day</div>
            </div>
        </div>

        ${metrics.inProgressTasks.length > 0 ? `
        <div class="task-list">
            <h2>🔄 Currently In Progress</h2>
            ${metrics.inProgressTasks.map(task => `
                <div class="task-item">
                    <div>
                        <strong>${task.id}</strong>: ${task.title}
                    </div>
                    <div class="progress-bar" style="width: 200px;">
                        <div class="progress-fill" style="width: ${task.progress}%">${task.progress}%</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${metrics.blockedTasks.length > 0 ? `
        <div class="task-list">
            <h2>🚧 Blocked Tasks</h2>
            ${metrics.blockedTasks.map(task => `
                <div class="task-item">
                    <div>
                        <strong>${task.id}</strong>: ${task.title}
                        <div style="color: #718096; font-size: 0.9em; margin-top: 5px;">
                            Blocked by: ${task.blockedBy.join(', ')}
                        </div>
                    </div>
                    <span class="status-badge status-blocked">Blocked</span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="task-list">
            <h2>📊 Status Distribution</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px;">
                <div style="text-align: center;">
                    <div class="stat-value" style="font-size: 2em;">${metrics.byStatus.completed}</div>
                    <div class="status-badge status-completed">Completed</div>
                </div>
                <div style="text-align: center;">
                    <div class="stat-value" style="font-size: 2em;">${metrics.byStatus['in-progress']}</div>
                    <div class="status-badge status-in-progress">In Progress</div>
                </div>
                <div style="text-align: center;">
                    <div class="stat-value" style="font-size: 2em;">${metrics.byStatus.blocked}</div>
                    <div class="status-badge status-blocked">Blocked</div>
                </div>
                <div style="text-align: center;">
                    <div class="stat-value" style="font-size: 2em;">${metrics.byStatus['not-started']}</div>
                    <div class="status-badge status-not-started">Not Started</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  }

  generateJSON(metrics) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: metrics,
      summary: {
        total_tasks: metrics.total,
        completion_percentage: parseFloat(metrics.completionRate),
        tasks_in_progress: metrics.byStatus['in-progress'],
        tasks_blocked: metrics.byStatus.blocked,
        daily_velocity: metrics.velocity.daily
      }
    }, null, 2);
  }

  run(format = 'markdown') {
    const metrics = this.calculateMetrics();
    
    switch (format) {
      case 'json':
        console.log(this.generateJSON(metrics));
        break;
        
      case 'html':
        const html = this.generateHTMLDashboard(metrics);
        fs.writeFileSync(this.dashboardPath, html);
        console.log(`✅ Dashboard generated: ${this.dashboardPath}`);
        console.log(`📊 Open in browser: file://${path.resolve(this.dashboardPath)}`);
        break;
        
      default:
        const markdown = this.generateMarkdownReport(metrics);
        console.log(markdown);
        // Also save to file
        fs.writeFileSync(this.progressPath, markdown);
        console.log(`\\n✅ Progress report saved to: ${this.progressPath}`);
    }
  }
}

// CLI handling
const reporter = new StatusReporter();
const formatArg = process.argv.find(arg => arg.startsWith('--format'));
const format = formatArg ? formatArg.split('=')[1] || process.argv[process.argv.indexOf(formatArg) + 1] : 'markdown';

reporter.run(format);