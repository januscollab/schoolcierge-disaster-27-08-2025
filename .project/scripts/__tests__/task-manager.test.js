const path = require('path');

// Mock the file system with proper implementation
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

const fs = require('fs');

describe('Task Manager', () => {
  const tasksPath = path.join(__dirname, '../../tasks/backlog.json');
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock initial task data
    const mockTasks = [
      {
        id: 'TEST-001',
        title: 'Test Task',
        status: 'not-started',
        priority: 'P1',
        category: 'testing'
      }
    ];
    
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockTasks));
  });

  describe('Task Operations', () => {
    test('should load tasks from file', () => {
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      const tasks = manager.loadTasks();
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('TEST-001');
    });

    test('should handle missing tasks file', () => {
      fs.existsSync.mockReturnValue(false);
      
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      const tasks = manager.loadTasks();
      
      expect(tasks).toEqual([]);
    });

    test('should add a new task', () => {
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      
      const newTaskId = manager.addTask('New Test Task', {
        priority: 'P2',
        category: 'testing'
      });
      
      expect(newTaskId).toMatch(/^TASK-\d{3}$/);
    });

    test('should update task status', () => {
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      
      const result = manager.updateTask('TEST-001', { status: 'in-progress' });
      
      expect(result).toBe(true);
    });
  });

  describe('Task Validation', () => {
    test('should validate priority levels', () => {
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      
      expect(manager.isValidPriority('P0')).toBe(true);
      expect(manager.isValidPriority('P1')).toBe(true);
      expect(manager.isValidPriority('P2')).toBe(true);
      expect(manager.isValidPriority('P3')).toBe(true);
      expect(manager.isValidPriority('P4')).toBe(false);
    });

    test('should validate status values', () => {
      const TaskManager = require('../task-manager');
      const manager = new TaskManager();
      
      expect(manager.isValidStatus('not-started')).toBe(true);
      expect(manager.isValidStatus('in-progress')).toBe(true);
      expect(manager.isValidStatus('completed')).toBe(true);
      expect(manager.isValidStatus('blocked')).toBe(true);
      expect(manager.isValidStatus('cancelled')).toBe(false);
    });
  });
});
