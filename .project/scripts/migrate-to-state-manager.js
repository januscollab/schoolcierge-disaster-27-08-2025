#!/usr/bin/env node

/**
 * Migration Script: Update Task Management Scripts to use TaskStateManager
 * 
 * This script identifies and updates all scripts that directly read/write backlog.json
 * to use the centralized TaskStateManager instead.
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TaskManagerMigrator {
  constructor() {
    this.scriptsDir = path.join(process.cwd(), '.project', 'scripts');
    this.backupDir = path.join(this.scriptsDir, 'backups-migration');
    this.logFile = path.join(this.scriptsDir, 'migration.log');
    
    this.patterns = {
      // Patterns that indicate direct backlog.json access
      directRead: [
        /fs\.readFileSync\s*\(\s*.*backlog\.json/g,
        /fs\.readFile\s*\(\s*.*backlog\.json/g,
        /require\s*\(\s*.*backlog\.json/g
      ],
      directWrite: [
        /fs\.writeFileSync\s*\(\s*.*backlog\.json/g,
        /fs\.writeFile\s*\(\s*.*backlog\.json/g
      ],
      taskManipulation: [
        /JSON\.parse\s*\(\s*fs\.readFileSync.*backlog/g,
        /tasks\s*=\s*JSON\.parse/g,
        /backlog\s*=\s*JSON\.parse/g
      ]
    };
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
      await fs.appendFile(this.logFile, logMessage);
    } catch (error) {
      console.warn('Failed to write to log file:', error.message);
    }
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create backup directory: ${error.message}`);
      }
    }
  }

  async scanScripts() {
    const files = await fs.readdir(this.scriptsDir);
    const jsFiles = files.filter(f => f.endsWith('.js') && 
      f !== 'task-state-manager.js' && 
      f !== 'migrate-to-state-manager.js' &&
      f !== 'test-runner.js' // Exclude test runner - under redevelopment
    );
    
    const results = {
      needMigration: [],
      alreadyMigrated: [],
      noChangesNeeded: []
    };

    for (const file of jsFiles) {
      const filePath = path.join(this.scriptsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if already uses TaskStateManager
      if (content.includes('task-state-manager') || content.includes('TaskState')) {
        results.alreadyMigrated.push(file);
        continue;
      }

      // Check if needs migration
      let needsMigration = false;
      for (const patternGroup of Object.values(this.patterns)) {
        for (const pattern of patternGroup) {
          if (pattern.test(content)) {
            needsMigration = true;
            break;
          }
        }
        if (needsMigration) break;
      }

      if (needsMigration) {
        results.needMigration.push(file);
      } else {
        results.noChangesNeeded.push(file);
      }
    }

    return results;
  }

  async backupFile(filename) {
    const sourcePath = path.join(this.scriptsDir, filename);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `${filename}.backup-${timestamp}`);
    
    await fs.copyFile(sourcePath, backupPath);
    await this.log(`Backed up ${filename} to ${path.basename(backupPath)}`);
  }

  async migrateScript(filename) {
    await this.log(`\n=== Migrating ${filename} ===`);
    
    // Backup original
    await this.backupFile(filename);
    
    const filePath = path.join(this.scriptsDir, filename);
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;

    // Track changes made
    const changes = [];

    // Add TaskState import if not present
    if (!content.includes('task-state-manager') && !content.includes('TaskState')) {
      // Find appropriate place to add import
      const requiresMatch = content.match(/^const .+ = require\(.+\);$/gm);
      if (requiresMatch) {
        const lastRequire = requiresMatch[requiresMatch.length - 1];
        const insertIndex = content.indexOf(lastRequire) + lastRequire.length;
        content = content.slice(0, insertIndex) + 
                 '\nconst TaskState = require(\'./task-state-manager\');' +
                 content.slice(insertIndex);
        changes.push('Added TaskState import');
      } else {
        // Add at the top after shebang if present
        const lines = content.split('\n');
        let insertIndex = 0;
        if (lines[0].startsWith('#!')) {
          insertIndex = 1;
        }
        lines.splice(insertIndex, 0, 'const TaskState = require(\'./task-state-manager\');');
        content = lines.join('\n');
        changes.push('Added TaskState import at top');
      }
    }

    // Replace direct file reads
    content = content.replace(
      /const\s+(\w+)\s*=\s*JSON\.parse\s*\(\s*fs\.readFileSync\s*\([^)]*backlog\.json[^)]*\)[^)]*\)/g,
      'const $1 = await TaskState.getTasks()'
    );

    content = content.replace(
      /(\w+)\s*=\s*JSON\.parse\s*\(\s*fs\.readFileSync\s*\([^)]*backlog\.json[^)]*\)[^)]*\)/g,
      '$1 = await TaskState.getTasks()'
    );

    // Replace direct file writes
    content = content.replace(
      /fs\.writeFileSync\s*\([^)]*backlog\.json[^)]*,\s*JSON\.stringify\s*\(([^)]+)\)[^)]*\)/g,
      '// Direct file write replaced with TaskState operations\n    // Original: $&\n    // TODO: Replace with appropriate TaskState.updateTask() or TaskState.updateTasks() calls'
    );

    // Convert functions to async if they aren't already
    if (changes.length > 0) {
      // Look for function declarations that need to be async
      const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
      let match;
      while ((match = functionPattern.exec(content)) !== null) {
        const funcName = match[1];
        if (content.includes(`${funcName}(`) && !match[0].includes('async')) {
          content = content.replace(match[0], match[0].replace('function', 'async function'));
          changes.push(`Made function ${funcName} async`);
        }
      }

      // Look for method declarations that need to be async
      const methodPattern = /(\w+)\s*\([^)]*\)\s*{/g;
      while ((match = methodPattern.exec(content)) !== null) {
        const methodName = match[1];
        if (content.includes('await') && !match[0].includes('async') && !match[0].includes('function')) {
          content = content.replace(match[0], `async ${match[0]}`);
          changes.push(`Made method ${methodName} async`);
        }
      }
    }

    // Only save if changes were made
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      await this.log(`Applied changes: ${changes.join(', ')}`);
      return changes.length;
    } else {
      await this.log('No changes needed after analysis');
      return 0;
    }
  }

  async generateMigrationReport(scanResults, migrationResults) {
    const report = `# Task Manager Migration Report

Generated: ${new Date().toISOString()}

## Summary
- **Files scanned**: ${scanResults.needMigration.length + scanResults.alreadyMigrated.length + scanResults.noChangesNeeded.length}
- **Files migrated**: ${migrationResults.filter(r => r.changes > 0).length}
- **Files already using TaskState**: ${scanResults.alreadyMigrated.length}
- **Files requiring no changes**: ${scanResults.noChangesNeeded.length}

## Files Migrated
${migrationResults.filter(r => r.changes > 0).map(r => `- ${r.file} (${r.changes} changes)`).join('\n') || 'None'}

## Files Already Using TaskState
${scanResults.alreadyMigrated.map(f => `- ${f}`).join('\n') || 'None'}

## Files Requiring Manual Review
${migrationResults.filter(r => r.changes === 0 && scanResults.needMigration.includes(r.file)).map(r => `- ${r.file} (detected patterns but no automatic changes made)`).join('\n') || 'None'}

## Next Steps
1. Review migrated files for correctness
2. Update function calls to use await where TaskState methods are called
3. Test all scripts to ensure they work with the new TaskStateManager
4. Remove any remaining direct backlog.json access

## Backup Location
All original files were backed up to: \`${this.backupDir}\`
`;

    const reportPath = path.join(this.scriptsDir, 'migration-report.md');
    await fs.writeFile(reportPath, report);
    await this.log(`\nMigration report saved to: ${reportPath}`);
    
    return report;
  }

  async run() {
    try {
      await this.log('Starting Task Manager Migration...');
      await this.ensureBackupDir();

      // Scan all scripts
      await this.log('Scanning scripts for migration needs...');
      const scanResults = await this.scanScripts();
      
      await this.log(`\nScan Results:
- Need migration: ${scanResults.needMigration.length} files
- Already migrated: ${scanResults.alreadyMigrated.length} files  
- No changes needed: ${scanResults.noChangesNeeded.length} files`);

      if (scanResults.needMigration.length === 0) {
        await this.log('\nNo files need migration. All scripts are already using TaskStateManager or don\'t access backlog.json directly.');
        return;
      }

      // Migrate each file
      const migrationResults = [];
      for (const file of scanResults.needMigration) {
        try {
          const changes = await this.migrateScript(file);
          migrationResults.push({ file, changes, success: true });
        } catch (error) {
          await this.log(`Failed to migrate ${file}: ${error.message}`);
          migrationResults.push({ file, changes: 0, success: false, error: error.message });
        }
      }

      // Generate report
      const report = await this.generateMigrationReport(scanResults, migrationResults);
      console.log('\n' + '='.repeat(60));
      console.log(report);

      await this.log('\nMigration completed!');

    } catch (error) {
      await this.log(`Migration failed: ${error.message}`);
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new TaskManagerMigrator();
  migrator.run().catch(console.error);
}

module.exports = TaskManagerMigrator;