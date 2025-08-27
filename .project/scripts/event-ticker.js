#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const term = require('terminal-kit').terminal;
const gradient = require('gradient-string');
const figlet = require('figlet');
const TaskState = require('./task-state-manager');

class EventTicker {
  constructor() {
    this.eventsPath = path.join(__dirname, '../tasks/events.jsonl');
    this.tasksPath = path.join(__dirname, '../tasks/backlog.json');
    this.isRunning = true;
    this.events = [];
    this.maxEvents = 100;
    this.scrollOffset = 0;
    this.lastEventTime = Date.now();
    this.currentFilter = 'all'; // all, agent, workflow, testing, task, system
    this.filterOptions = ['all', 'agent', 'workflow', 'testing', 'task', 'system'];
    this.currentFilterIndex = 0;
    this.showDetails = false;
    
    // CREAITE branding
    this.tealGradient = gradient(['#008B8B', '#00CED1', '#40E0D0']);
    this.goldGradient = gradient(['#FFD700', '#FFA500']);
    this.successGradient = gradient(['#10b981', '#059669']);
    this.warningGradient = gradient(['#fbbf24', '#f59e0b']);
    this.dangerGradient = gradient(['#ef4444', '#dc2626']);
    
    // Event type colors
    this.eventColors = {
      'task_started': 'green',
      'task_progress': 'yellow', 
      'task_completed': 'green',
      'task_blocked': 'red',
      'command_executed': 'cyan',
      'system_event': 'blue',
      'error': 'red',
      'info': 'white',
      'warning': 'yellow',
      // Agent workflow events
      'agent_routing_start': 'magenta',
      'agent_routing_complete': 'magenta',
      'workflow_started': 'blue',
      'workflow_completed': 'green',
      'workflow_failed': 'red',
      'phase_start': 'cyan',
      'phase_completed': 'green',
      'phase_failed': 'red',
      'agent_start': 'blue',
      'agent_completed': 'green',
      'agent_failed': 'red',
      'intelligent_analysis_start': 'magenta',
      'intelligent_analysis_complete': 'magenta',
      'test_phase_start': 'yellow',
      'test_phase_success': 'green',
      'test_phase_failed': 'red',
      'intelligent_testing_failed': 'red'
    };
    
    this.eventIcons = {
      'task_started': '🚀',
      'task_progress': '📊',
      'task_completed': '✅',
      'task_blocked': '🚫',
      'command_executed': '⚡',
      'system_event': 'ℹ️',
      'error': '❌',
      'info': '💬',
      'warning': '⚠️',
      // Agent workflow events
      'agent_routing_start': '🎯',
      'agent_routing_complete': '🎯',
      'workflow_started': '🔄',
      'workflow_completed': '🎉',
      'workflow_failed': '💥',
      'phase_start': '📋',
      'phase_completed': '✅',
      'phase_failed': '❌',
      'agent_start': '🤖',
      'agent_completed': '✨',
      'agent_failed': '🚨',
      'intelligent_analysis_start': '🧠',
      'intelligent_analysis_complete': '🧠',
      'test_phase_start': '🧪',
      'test_phase_success': '✅',
      'test_phase_failed': '❌',
      'intelligent_testing_failed': '🚨'
    };
  }

  initializeEventsFile() {
    if (!fs.existsSync(this.eventsPath)) {
      // Create initial events file
      fs.writeFileSync(this.eventsPath, '');
      this.logEvent('system_event', 'Event ticker initialized', { component: 'event-ticker' });
    }
  }

  logEvent(type, message, data = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      // Add intelligent categorization
      category: this.categorizeEvent(type),
      priority: this.getPriority(type)
    };
    
    // Append to JSONL file (one JSON object per line)
    try {
      fs.appendFileSync(this.eventsPath, JSON.stringify(event) + '\n');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to log event:', error.message);
    }
  }
  
  categorizeEvent(type) {
    const categories = {
      task: ['task_started', 'task_progress', 'task_completed', 'task_blocked'],
      agent: ['agent_routing_start', 'agent_routing_complete', 'agent_start', 'agent_completed', 'agent_failed'],
      workflow: ['workflow_started', 'workflow_completed', 'workflow_failed', 'phase_start', 'phase_completed', 'phase_failed'],
      intelligence: ['intelligent_analysis_start', 'intelligent_analysis_complete'],
      testing: ['test_phase_start', 'test_phase_success', 'test_phase_failed', 'intelligent_testing_failed'],
      system: ['command_executed', 'system_event', 'error', 'info', 'warning']
    };
    
    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(type)) {
        return category;
      }
    }
    
    return 'unknown';
  }
  
  getPriority(type) {
    const priorities = {
      high: ['error', 'workflow_failed', 'agent_failed', 'task_blocked', 'intelligent_testing_failed'],
      medium: ['workflow_started', 'agent_routing_start', 'task_started', 'phase_failed'],
      low: ['info', 'task_progress', 'phase_start', 'agent_start']
    };
    
    for (const [priority, types] of Object.entries(priorities)) {
      if (types.includes(type)) {
        return priority;
      }
    }
    
    return 'low';
  }

  loadEvents() {
    if (!fs.existsSync(this.eventsPath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(this.eventsPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      // Parse each line as JSON and keep only the most recent events
      const events = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      // Keep only recent events and sort by timestamp
      return events
        .slice(-this.maxEvents)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
    } catch (error) {
      return [];
    }
  }

  watchForChanges() {
    // Watch the events file for changes
    if (fs.existsSync(this.eventsPath)) {
      fs.watchFile(this.eventsPath, { interval: 500 }, () => {
        this.render();
      });
    }
    
    // Also watch the tasks file for automatic event generation
    if (fs.existsSync(this.tasksPath)) {
      fs.watchFile(this.tasksPath, { interval: 1000 }, () => {
        this.checkTaskChanges();
      });
    }
  }

  checkTaskChanges() {
    // Auto-generate events based on task changes
    try {
      const tasks = JSON.parse(fs.readFileSync(this.tasksPath, 'utf8'));
      const now = Date.now();
      
      // Check for recently updated tasks
      tasks.forEach(task => {
        if (task.updated_at) {
          const updated = new Date(task.updated_at).getTime();
          if (updated > this.lastEventTime) {
            this.logEvent('task_progress', `${task.id}: ${task.status} (${task.progress || 0}%)`, {
              taskId: task.id,
              status: task.status,
              progress: task.progress,
              title: task.title
            });
          }
        }
      });
      
      this.lastEventTime = now;
    } catch (error) {
      // Ignore parsing errors
    }
  }

  displayHeader() {
    term.moveTo(1, 1);
    term.eraseLine();
    
    // CREAITE logo in header
    const logo = this.tealGradient('CRE') + this.goldGradient('AI') + this.tealGradient('TE');
    const title = ' EVENT TICKER';
    const timestamp = new Date().toLocaleTimeString();
    
    term(logo + title);
    term.moveTo(40, 1);
    term.gray('│ Live Updates: ');
    term.green('●');
    term.moveTo(60, 1);
    term.gray('│ ');
    term.white(timestamp);
    
    term.moveTo(1, 2);
    term(this.tealGradient('━'.repeat(term.width)));
  }

  displayStats() {
    const events = this.loadEvents();
    const filteredEvents = this.filterEvents(events);
    const recentEvents = events.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    term.moveTo(1, 4);
    term.white('📊 Stats: ');
    term.cyan(`${filteredEvents.length}/${events.length} events`);
    term.white(' │ ');
    term.yellow(`${recentEvents.length} recent`);
    term.white(' │ ');
    
    // Show current filter
    term.white('Filter: ');
    if (this.currentFilter === 'all') {
      term.green('ALL');
    } else {
      term.magenta(this.currentFilter.toUpperCase());
    }
    
    // Category breakdown
    const categories = {};
    filteredEvents.forEach(e => {
      const cat = e.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    term.moveTo(1, 5);
    term.white('🏷️  Categories: ');
    Object.entries(categories).forEach(([cat, count], index) => {
      if (index > 0) term.white(' │ ');
      const color = this.getCategoryColor(cat);
      term[color](`${cat}: ${count}`);
    });
  }
  
  filterEvents(events) {
    if (this.currentFilter === 'all') {
      return events;
    }
    
    return events.filter(e => e.category === this.currentFilter);
  }
  
  getCategoryColor(category) {
    const colors = {
      agent: 'magenta',
      workflow: 'blue',
      intelligence: 'cyan',
      testing: 'yellow',
      task: 'green',
      system: 'gray'
    };
    
    return colors[category] || 'white';
  }

  displayEventsList() {
    const events = this.loadEvents();
    const filteredEvents = this.filterEvents(events);
    const startY = 7;
    const maxRows = term.height - 9;
    
    // Header
    term.moveTo(1, startY);
    if (this.showDetails) {
      term.bold.cyan('TIMESTAMP     TASK-ID  PRI TYPE              MESSAGE                     DATA');
    } else {
      term.bold.cyan('TIMESTAMP     TASK-ID  PRI TYPE              MESSAGE');
    }
    term.moveTo(1, startY + 1);
    term.gray('─'.repeat(term.width));
    
    // Events list
    const visibleEvents = filteredEvents.slice(this.scrollOffset, this.scrollOffset + maxRows);
    
    visibleEvents.forEach((event, index) => {
      const y = startY + 2 + index;
      term.moveTo(1, y);
      
      // Timestamp
      const time = new Date(event.timestamp).toLocaleTimeString();
      term.gray(time.padEnd(14));
      
      // Extract and display Task ID
      const taskId = this.extractTaskId(event);
      if (taskId) {
        term.cyan(taskId.padEnd(9));
      } else {
        term.gray('-'.padEnd(9));
      }
      
      // Priority indicator
      const priority = event.priority || 'low';
      const priorityColors = { high: 'red', medium: 'yellow', low: 'gray' };
      const priorityIcons = { high: '⚠️ ', medium: '🗯e0f ', low: 'ℹ️ ' };
      term[priorityColors[priority]](priorityIcons[priority]);
      
      // Event type with icon
      const icon = this.eventIcons[event.type] || '•';
      const color = this.eventColors[event.type] || 'white';
      term[color](`${icon} ${event.type.padEnd(15)}`);
      
      // Message (truncated to fit) - adjust for Task ID column
      let maxMessageLength = this.showDetails ? 20 : term.width - 44;
      
      // Prepend TASK-ID to message if it exists and isn't already at the start
      let displayMessage = event.message;
      if (taskId && !displayMessage.toUpperCase().startsWith(taskId)) {
        displayMessage = `${taskId}: ${displayMessage}`;
      }
      
      let message = displayMessage.substring(0, maxMessageLength);
      if (displayMessage.length > maxMessageLength) {
        message += '…';
      }
      term.white(message);
      
      // Show important data for agent/workflow events
      if (this.showDetails && this.isAgentWorkflowEvent(event)) {
        const dataStr = this.formatEventData(event);
        if (dataStr) {
          term.moveTo(65, y);
          term.gray(dataStr.substring(0, term.width - 65));
        }
      }
      
      // Highlight recent events
      if (Date.now() - new Date(event.timestamp).getTime() < 10000) { // Last 10 seconds
        term.moveTo(term.width - 3, y);
        term.bold.green('●');
      }
      
      // Highlight agent workflow events
      if (this.isAgentWorkflowEvent(event)) {
        term.moveTo(term.width - 5, y);
        term.magenta('🤖');
      }
    });
    
    // Scroll indicator
    if (filteredEvents.length > maxRows) {
      term.moveTo(term.width - 15, startY);
      term.gray(`${this.scrollOffset + 1}/${filteredEvents.length}`);
    }
  }
  
  isAgentWorkflowEvent(event) {
    const agentWorkflowTypes = [
      'agent_routing_start', 'agent_routing_complete', 'workflow_started',
      'workflow_completed', 'workflow_failed', 'phase_start', 'phase_completed',
      'phase_failed', 'agent_start', 'agent_completed', 'agent_failed',
      'intelligent_analysis_start', 'intelligent_analysis_complete'
    ];
    
    return agentWorkflowTypes.includes(event.type);
  }
  
  extractTaskId(event) {
    // Try to extract task ID from various sources
    if (event.data?.taskId) {
      return event.data.taskId;
    }
    
    // Extract from message if it contains TASK-XXX pattern
    const messageMatch = event.message.match(/TASK-\d{3}/i);
    if (messageMatch) {
      return messageMatch[0].toUpperCase();
    }
    
    // Extract from workflowId if present
    if (event.data?.workflowId) {
      const workflowMatch = event.data.workflowId.match(/TASK-\d{3}/i);
      if (workflowMatch) {
        return workflowMatch[0].toUpperCase();
      }
    }
    
    // Check if it's a workflow event with taskId in different field
    if (event.workflowId) {
      const match = event.workflowId.match(/TASK-\d{3}/i);
      if (match) return match[0].toUpperCase();
    }
    
    return null;
  }
  
  formatEventData(event) {
    const data = event.data || {};
    const important = [];
    
    // Extract important data based on event type (skip taskId as it's now in its own column)
    if (data.domain) important.push(`Domain: ${data.domain}`);
    if (data.agent || data.primaryAgent) important.push(`Agent: ${data.agent || data.primaryAgent}`);
    if (data.phase) important.push(`Phase: ${data.phase}`);
    if (data.confidence) important.push(`Conf: ${Math.round(data.confidence * 100)}%`);
    if (data.duration) important.push(`${Math.round(data.duration / 1000)}s`);
    if (data.error) important.push(`Error: ${data.error.substring(0, 20)}`);
    
    return important.slice(0, 3).join(' | ');
  }

  displayHelpBar() {
    const y = term.height - 1;
    term.moveTo(1, y);
    term.eraseLine();
    term.bgBlack.white(
      ' [↑↓] Scroll  [F] Filter  [D] Details  [C] Clear  [T] Test  [Q] Quit '
    );
  }

  setupKeyboardHandlers() {
    term.grabInput(true);
    
    term.on('key', (key) => {
      switch (key) {
        case 'q':
        case 'Q':
        case 'ESCAPE':
        case 'CTRL_C':
          this.quit();
          break;
          
        case 'UP':
          if (this.scrollOffset > 0) {
            this.scrollOffset--;
            this.render();
          }
          break;
          
        case 'DOWN':
          const events = this.loadEvents();
          const filteredEvents = this.filterEvents(events);
          const maxScroll = Math.max(0, filteredEvents.length - (term.height - 9));
          if (this.scrollOffset < maxScroll) {
            this.scrollOffset++;
            this.render();
          }
          break;
          
        case 'c':
        case 'C':
          // Clear events
          fs.writeFileSync(this.eventsPath, '');
          this.logEvent('system_event', 'Event log cleared by user');
          this.render();
          break;
          
        case 't':
        case 'T':
          // Test event
          this.logEvent('info', 'Test event generated by user', { 
            test: true, 
            timestamp: new Date().toISOString() 
          });
          this.render();
          break;
          
        case 'f':
        case 'F':
          // Cycle through filters
          this.currentFilterIndex = (this.currentFilterIndex + 1) % this.filterOptions.length;
          this.currentFilter = this.filterOptions[this.currentFilterIndex];
          this.scrollOffset = 0; // Reset scroll when changing filter
          this.logEvent('system_event', `Filter changed to: ${this.currentFilter}`);
          this.render();
          break;
          
        case 'd':
        case 'D':
          // Toggle details view
          this.showDetails = !this.showDetails;
          this.logEvent('system_event', `Details view: ${this.showDetails ? 'enabled' : 'disabled'}`);
          this.render();
          break;
          
        case 'p':
        case 'P':
          // Toggle pause (for now just show a message)
          this.logEvent('system_event', this.isRunning ? 'Event ticker paused' : 'Event ticker resumed');
          this.isRunning = !this.isRunning;
          this.render();
          break;
      }
    });
  }

  render() {
    if (!this.isRunning) return;
    
    term.clear();
    this.displayHeader();
    this.displayStats();
    this.displayEventsList();
    this.displayHelpBar();
  }

  quit() {
    // Clean up
    fs.unwatchFile(this.eventsPath);
    fs.unwatchFile(this.tasksPath);
    
    // Release terminal
    term.grabInput(false);
    term.fullscreen(false);
    term.hideCursor(false);
    term.clear();
    
    console.log('\n' + this.tealGradient('━'.repeat(60)));
    console.log(
      this.tealGradient('CRE') + 
      this.goldGradient('AI') + 
      this.tealGradient('TE') + 
      ' Event Ticker Session Complete'
    );
    console.log(this.tealGradient('━'.repeat(60)) + '\n');
    
    const events = this.loadEvents();
    console.log('📊 Session Summary:');
    console.log(`  • Total Events: ${events.length}`);
    console.log(`  • Events File: ${this.eventsPath}`);
    console.log('  • Use "cx ticker" to restart monitoring\n');
    
    process.exit(0);
  }

  async run() {
    // Setup terminal
    term.fullscreen(true);
    term.hideCursor();
    term.clear();
    
    // Initialize
    this.initializeEventsFile();
    this.logEvent('system_event', 'Event ticker started', { 
      pid: process.pid,
      session: new Date().toISOString()
    });
    
    // Setup keyboard handlers
    this.setupKeyboardHandlers();
    
    // Start watching for changes
    this.watchForChanges();
    
    // Initial render
    this.render();
    
    // Auto-refresh every 2 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.render();
      }
    }, 2000);
    
    // Handle termination
    process.on('SIGINT', () => this.quit());
    process.on('SIGTERM', () => this.quit());
  }
}

// Export for use by other scripts
async function logEvent(type, message, data = {}) {
  const eventsPath = path.join(__dirname, '../tasks/events.jsonl');
  const event = {
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  };
  
  try {
    fs.appendFileSync(eventsPath, JSON.stringify(event) + '\n');
  } catch (error) {
    // Silently fail if we can't log
  }
}

// Run the ticker if called directly
if (require.main === module) {
  const ticker = new EventTicker();
  ticker.run().catch((err) => {
    term.clear();
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { logEvent };