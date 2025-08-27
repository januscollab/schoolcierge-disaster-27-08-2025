#!/usr/bin/env node

/**
 * Fix False Completions - Update task statuses to reflect reality
 * Based on comprehensive audit findings
 */

const TaskState = require('./task-state-manager');

async function fixFalseCompletions() {
  console.log('🔧 Fixing false task completion statuses...\n');
  
  const corrections = [
    {
      taskId: 'TASK-002',
      updates: {
        status: 'in-progress',
        progress: 30,
        implementation_notes: {
          ...((await TaskState.getTask('TASK-002')).implementation_notes || {}),
          audit_correction: true,
          audit_reason: 'Railway config exists but no actual deployment - corrected from false completion',
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'Railway config files exist but no actual deployment'
    },
    {
      taskId: 'TASK-005', 
      updates: {
        status: 'in-progress',
        progress: 60,
        implementation_notes: {
          ...((await TaskState.getTask('TASK-005')).implementation_notes || {}),
          audit_correction: true,
          audit_reason: 'Express boilerplate exists but server fails to start - corrected from false completion',
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'Express API structure exists but server doesn\'t start'
    },
    {
      taskId: 'TASK-008',
      updates: {
        status: 'in-progress', 
        progress: 15,
        implementation_notes: {
          ...((await TaskState.getTask('TASK-008')).implementation_notes || {}),
          audit_correction: true,
          audit_reason: 'Mobile dependencies added but no actual app structure - corrected from false completion',
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'Mobile dependencies exist but no Expo app structure'
    },
    {
      taskId: 'TASK-009',
      updates: {
        status: 'in-progress',
        progress: 20, 
        implementation_notes: {
          ...((await TaskState.getTask('TASK-009')).implementation_notes || {}),
          audit_correction: true,
          audit_reason: 'Basic GitHub workflow exists but no Railway integration - corrected from false completion',
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'Basic CI workflow exists but missing Railway deployment'
    },
    {
      taskId: 'TASK-018',
      updates: {
        status: 'in-progress',
        progress: 25,
        implementation_notes: {
          ...((await TaskState.getTask('TASK-018')).implementation_notes || {}),
          audit_correction: true, 
          audit_reason: 'BullMQ dependency exists but no queue implementation - corrected from false completion',
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'BullMQ dependency installed but no actual queue implementation'
    },
    {
      taskId: 'TASK-046',
      updates: {
        status: 'in-progress',
        progress: 30,
        implementation_notes: {
          ...((await TaskState.getTask('TASK-046')).implementation_notes || {}),
          audit_correction: true,
          audit_reason: 'Redis in docker-compose but missing connection utilities - corrected from false completion', 
          corrected_at: new Date().toISOString()
        }
      },
      reason: 'Redis configured in docker-compose but missing connection utilities'
    }
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const correction of corrections) {
    try {
      const originalTask = await TaskState.getTask(correction.taskId);
      console.log(`📝 ${correction.taskId}: ${originalTask.status} (${originalTask.progress}%) → ${correction.updates.status} (${correction.updates.progress}%)`);
      console.log(`   Reason: ${correction.reason}\n`);
      
      await TaskState.updateTask(
        correction.taskId, 
        correction.updates,
        'audit-correction'
      );
      
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${correction.taskId}:`, error.message);
      failureCount++;
    }
  }

  console.log(`\n✅ Task status corrections complete:`);
  console.log(`   - Successfully updated: ${successCount} tasks`);
  console.log(`   - Failed: ${failureCount} tasks`);
  console.log(`\nRun 'cx status' to see the corrected status display.`);
}

if (require.main === module) {
  fixFalseCompletions().catch(console.error);
}

module.exports = { fixFalseCompletions };