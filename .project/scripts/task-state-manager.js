/**
 * Task State Manager - Single Source of Truth for Task Data
 * 
 * This module provides centralized, atomic, and audited access to task state.
 * ALL task mutations must go through this interface to ensure data integrity.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class TaskStateManager {
  constructor() {
    this.backlogPath = path.join(process.cwd(), '.project', 'tasks', 'backlog.json');
    this.eventsPath = path.join(process.cwd(), '.project', 'tasks', 'events.jsonl');
    this.backupDir = path.join(process.cwd(), '.project', 'tasks', 'backups');
    
    // In-memory cache
    this._cache = null;
    this._cacheTimestamp = null;
    this._cacheTTL = 5000; // 5 seconds
    
    // Ensure backup directory exists
    this._ensureBackupDir();
  }

  async _ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error('Failed to create backup directory:', error);
      }
    }
  }

  /**
   * Load backlog with caching
   */
  async _loadBacklog() {
    const now = Date.now();
    
    // Return cached version if still valid
    if (this._cache && this._cacheTimestamp && (now - this._cacheTimestamp) < this._cacheTTL) {
      return this._cache;
    }

    try {
      const data = await fs.readFile(this.backlogPath, 'utf-8');
      const backlog = JSON.parse(data);
      
      // Validate structure
      if (!Array.isArray(backlog)) {
        throw new Error('Backlog must be an array');
      }

      // Cache the data
      this._cache = backlog;
      this._cacheTimestamp = now;
      
      return backlog;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Backlog file not found. Please initialize the project first.');
      }
      throw new Error(`Failed to load backlog: ${error.message}`);
    }
  }

  /**
   * Save backlog with backup and validation
   */
  async _saveBacklog(backlog, source = 'unknown') {
    // Validate before saving
    if (!Array.isArray(backlog)) {
      throw new Error('Invalid backlog structure: must be an array');
    }

    // Validate each task
    for (const task of backlog) {
      if (!task.id || !task.title || !task.status) {
        throw new Error(`Invalid task structure: ${JSON.stringify(task)}`);
      }
    }

    // Create backup before saving
    await this._createBackup(source);

    try {
      await fs.writeFile(this.backlogPath, JSON.stringify(backlog, null, 2));
      
      // Update cache
      this._cache = backlog;
      this._cacheTimestamp = Date.now();
      
    } catch (error) {
      throw new Error(`Failed to save backlog: ${error.message}`);
    }
  }

  /**
   * Create timestamped backup
   */
  async _createBackup(source = 'unknown') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backlog-${timestamp}-${source}.json`);
      
      if (fsSync.existsSync(this.backlogPath)) {
        await fs.copyFile(this.backlogPath, backupPath);
      }
      
      // Keep only last 10 backups to prevent disk bloat
      await this._cleanupOldBackups();
      
    } catch (error) {
      console.warn('Failed to create backup:', error.message);
    }
  }

  /**
   * Remove old backups (keep last 10)
   */
  async _cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backlog-') && f.endsWith('.json'))
        .sort()
        .reverse();

      // Remove files beyond the 10 most recent
      for (let i = 10; i < backupFiles.length; i++) {
        await fs.unlink(path.join(this.backupDir, backupFiles[i]));
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error.message);
    }
  }

  /**
   * Log event to events.jsonl
   */
  async _logEvent(event) {
    const eventRecord = {
      timestamp: new Date().toISOString(),
      ...event
    };

    try {
      const eventLine = JSON.stringify(eventRecord) + '\n';
      await fs.appendFile(this.eventsPath, eventLine);
    } catch (error) {
      console.error('Failed to log event:', error.message);
    }
  }

  /**
   * Validate business rules before update
   */
  _validateUpdate(existingTask, updates, source) {
    // Protected tasks cannot be modified
    if (existingTask.implementation_notes?.verified === true && 
        existingTask.implementation_notes?.do_not_revert === true) {
      
      // Allow progress updates and completion timestamps for verified tasks
      const allowedUpdates = ['progress', 'completed_at', 'updated_at', 'implementation_notes'];
      const updateKeys = Object.keys(updates);
      const hasDisallowedUpdate = updateKeys.some(key => !allowedUpdates.includes(key));
      
      if (hasDisallowedUpdate) {
        throw new Error(`Task ${existingTask.id} is verified and protected from modification. Attempted updates: ${updateKeys.join(', ')}`);
      }
    }

    // Status transition validation
    if (updates.status && updates.status !== existingTask.status) {
      const validTransitions = {
        'not-started': ['in-progress', 'blocked'],
        'in-progress': ['completed', 'blocked', 'not-started'],
        'blocked': ['in-progress', 'not-started'],
        'completed': ['in-progress'] // Allow re-opening if needed
      };

      const allowedNextStates = validTransitions[existingTask.status] || [];
      if (!allowedNextStates.includes(updates.status)) {
        throw new Error(`Invalid status transition: ${existingTask.status} → ${updates.status}`);
      }
    }

    // Auto-set completion timestamp
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    // Auto-update progress based on status
    if (updates.status === 'completed' && updates.progress === undefined) {
      updates.progress = 100;
    }
    if (updates.status === 'not-started' && updates.progress === undefined) {
      updates.progress = 0;
    }
  }

  /**
   * Get single task by ID
   */
  async getTask(taskId) {
    const backlog = await this._loadBacklog();
    return backlog.find(task => task.id === taskId);
  }

  /**
   * Get multiple tasks by criteria
   */
  async getTasks(filter = {}) {
    const backlog = await this._loadBacklog();
    
    return backlog.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.category && task.category !== filter.category) return false;
      if (filter.ids && !filter.ids.includes(task.id)) return false;
      return true;
    });
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status) {
    return this.getTasks({ status });
  }

  /**
   * Update single task
   */
  async updateTask(taskId, updates, source = 'unknown') {
    const backlog = await this._loadBacklog();
    const taskIndex = backlog.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error(`Task ${taskId} not found`);
    }

    const existingTask = backlog[taskIndex];
    
    // Validate the update
    this._validateUpdate(existingTask, updates, source);

    // Apply updates
    const updatedTask = {
      ...existingTask,
      ...updates,
      updated_at: new Date().toISOString()
    };

    backlog[taskIndex] = updatedTask;

    // Save to disk
    await this._saveBacklog(backlog, source);

    // Log the event
    await this._logEvent({
      operation: 'updateTask',
      taskId: taskId,
      changes: updates,
      source: source
    });

    return updatedTask;
  }

  /**
   * Batch update multiple tasks
   */
  async updateTasks(updates, source = 'batch-update') {
    const backlog = await this._loadBacklog();
    const results = [];

    // Validate all updates first
    for (const { taskId, updates: taskUpdates } of updates) {
      const taskIndex = backlog.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      this._validateUpdate(backlog[taskIndex], taskUpdates, source);
    }

    // Apply all updates
    for (const { taskId, updates: taskUpdates } of updates) {
      const taskIndex = backlog.findIndex(task => task.id === taskId);
      const existingTask = backlog[taskIndex];
      
      const updatedTask = {
        ...existingTask,
        ...taskUpdates,
        updated_at: new Date().toISOString()
      };

      backlog[taskIndex] = updatedTask;
      results.push(updatedTask);

      // Log each update
      await this._logEvent({
        operation: 'updateTask',
        taskId: taskId,
        changes: taskUpdates,
        source: source,
        batchId: `batch-${Date.now()}`
      });
    }

    // Save once at the end
    await this._saveBacklog(backlog, source);

    return results;
  }

  /**
   * Add new task
   */
  async addTask(task, source = 'task-manager') {
    // Validate required fields
    if (!task.id || !task.title || !task.status) {
      throw new Error('Task must have id, title, and status');
    }

    const backlog = await this._loadBacklog();
    
    // Check for duplicate ID
    if (backlog.find(t => t.id === task.id)) {
      throw new Error(`Task ${task.id} already exists`);
    }

    // Set defaults
    const newTask = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...task
    };

    backlog.push(newTask);
    await this._saveBacklog(backlog, source);

    // Log the event
    await this._logEvent({
      operation: 'addTask',
      taskId: task.id,
      task: newTask,
      source: source
    });

    return newTask;
  }

  /**
   * Generate health report
   */
  async generateHealthReport() {
    const backlog = await this._loadBacklog();
    
    const metrics = {
      total: backlog.length,
      byStatus: {},
      byPriority: {},
      stuckTasks: [],
      blockedTasks: [],
      completedTasks: []
    };

    for (const task of backlog) {
      // Count by status
      metrics.byStatus[task.status] = (metrics.byStatus[task.status] || 0) + 1;
      
      // Count by priority
      if (task.priority) {
        metrics.byPriority[task.priority] = (metrics.byPriority[task.priority] || 0) + 1;
      }

      // Identify problem tasks
      if (task.status === 'in-progress') {
        const daysSinceUpdate = task.updated_at ? 
          (Date.now() - new Date(task.updated_at)) / (1000 * 60 * 60 * 24) : 999;
        
        if (daysSinceUpdate > 3) {
          metrics.stuckTasks.push({
            id: task.id,
            title: task.title,
            daysSinceUpdate: Math.round(daysSinceUpdate)
          });
        }
      }

      // Track blocked tasks (only if not completed)
      if ((task.status === 'blocked' || (task.dependencies?.blocked_by?.length > 0)) && 
          task.status !== 'completed') {
        metrics.blockedTasks.push({
          id: task.id,
          title: task.title,
          blockedBy: task.dependencies?.blocked_by || []
        });
      }

      // Track completed tasks
      if (task.status === 'completed') {
        metrics.completedTasks.push({
          id: task.id,
          title: task.title,
          completed_at: task.completed_at
        });
      }
    }

    return metrics;
  }

  /**
   * Invalidate cache (useful for testing or when external changes occur)
   */
  invalidateCache() {
    this._cache = null;
    this._cacheTimestamp = null;
  }

  /**
   * Get recent events from log
   */
  async getRecentEvents(limit = 50) {
    try {
      const data = await fs.readFile(this.eventsPath, 'utf-8');
      const lines = data.trim().split('\n').filter(line => line);
      
      return lines
        .slice(-limit)
        .map(line => JSON.parse(line))
        .reverse(); // Most recent first
        
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No events yet
      }
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TaskStateManager();