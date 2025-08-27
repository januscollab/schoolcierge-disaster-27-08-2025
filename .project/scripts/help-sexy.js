#!/usr/bin/env node

const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const Table = require('cli-table3');
const figlet = require('figlet');

class SexyHelp {
  constructor() {
    // Beautiful gradients - teal and gold for CREAITE
    this.tealGradient = gradient(['#008B8B', '#00CED1', '#40E0D0']);
    this.goldGradient = gradient(['#FFD700', '#FFA500']);
    this.creaiteGradient = gradient(['#00C9A7', '#00B4D8', '#0077B6']);
    this.aiGradient = gradient(['#FFD60A', '#FFC300', '#FFB700']);
    this.successGradient = gradient(['#06FFA5', '#00C9A7']);

    this.commands = {
      'Task Management': [
        { cmd: 'cx add "title"', desc: 'Add a new task', alias: '' },
        { cmd: 'cx list', desc: 'List all tasks', alias: 'cx ls' },
        { cmd: 'cx detail [ID]', desc: 'Show task details', alias: 'cx show' },
        { cmd: 'cx build [ID]', desc: '🚀 Smart task builder - handles full lifecycle', alias: 'cx b', hot: true },
        { cmd: 'cx complete [ID]', desc: 'Mark task as completed', alias: 'cx done' },
        { cmd: 'cx next', desc: 'Show what to work on next', alias: 'cx whats-next' },
      ],
      'Dashboards & Visualization': [
        {
          cmd: 'cx live',
          desc: '🔥 Live dashboard with real-time updates',
          alias: 'cx l',
          hot: true,
        },
        { cmd: 'cx dash', desc: 'Interactive terminal dashboard', alias: 'cx d' },
        { cmd: 'cx dashboard', desc: 'Generate HTML dashboard in browser', alias: '' },
        { cmd: 'cx status', desc: 'Beautiful progress report (or status [ID] for task)', alias: 'cx s' },
        { cmd: 'cx gantt', desc: '📊 Interactive terminal Gantt chart', alias: '', hot: true },
      ],
      'Parallel Execution': [
        { cmd: 'cx analyze', desc: '🔍 Analyze parallel task opportunities', alias: '', hot: true },
        {
          cmd: 'cx parallel [IDs]',
          desc: '🚀 Execute multiple tasks in parallel',
          alias: 'cx p',
          hot: true,
        },
        {
          cmd: 'cx parallel --auto',
          desc: '🤖 Auto-select best parallel tasks',
          alias: '',
          hot: true,
        },
      ],
      'Sprint Management': [
        { cmd: 'cx sprint', desc: 'View sprint status', alias: '' },
        { cmd: 'cx sprint:new', desc: 'Create new sprint', alias: 'cx sprint:create' },
        { cmd: 'cx sprint:status', desc: 'Detailed sprint report', alias: '' },
      ],
      'Advanced Features': [
        { cmd: 'cx validate', desc: 'Validate task dependencies', alias: '' },
        { cmd: 'cx security', desc: 'Run security audit', alias: 'cx audit' },
        { cmd: 'cx test [ID]', desc: 'Test a specific task', alias: '' },
      ],
      'Live Monitoring': [
        {
          cmd: 'cx ticker',
          desc: '🎬 Live event feed - watch all system activity',
          alias: 'cx events',
          hot: true,
        },
      ],
    };

    // Keyboard shortcuts removed - no longer needed
  }

  displayHeader() {
    console.clear();

    // CREAITE branding with teal CRE/TE and gold AI
    console.log();
    
    // Generate the full ASCII art first
    const fullLogo = figlet.textSync('CREAITE', {
      font: 'Big',
      horizontalLayout: 'default',
    });
    
    // Split into lines and color each part
    const lines = fullLogo.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        // For 'Big' font, approximate positions: CRE (0-29), AI (29-47), TE (47-end)
        const cre = line.substring(0, 29);
        const ai = line.substring(29, 47);
        const te = line.substring(47);
        
        // Apply colors directly to text
        console.log(
          this.tealGradient(cre) + 
          this.goldGradient(ai) + 
          this.tealGradient(te)
        );
      } else {
        console.log(line);
      }
    });

    console.log(
      boxen(
        chalk.bold.white('🚀 SchoolCierge Task Management System\n') +
          chalk.gray('Powered by ') +
          this.goldGradient('AI-driven insights'),
        {
          padding: 1,
          margin: { top: 0, bottom: 1 },
          borderStyle: 'double',
          borderColor: 'cyan',
          align: 'center',
        }
      )
    );
  }

  displayCommands() {
    console.log(this.creaiteGradient('━━━ COMMANDS ━━━\n'));

    Object.entries(this.commands).forEach(([category, commands]) => {
      // Category header
      console.log(chalk.bold.yellow(`\n📦 ${category}`));

      // Create a table for each category
      const table = new Table({
        head: [
          chalk.cyan.bold('Command'),
          chalk.cyan.bold('Description'),
          chalk.cyan.bold('Alias'),
        ],
        style: {
          head: [],
          border: ['gray'],
        },
        colWidths: [20, 45, 20],
      });

      commands.forEach((cmd) => {
        const command = cmd.hot ? chalk.red.bold(cmd.cmd) : chalk.green(cmd.cmd);
        const desc = cmd.hot ? chalk.yellow(cmd.desc) : cmd.desc;
        table.push([command, desc, chalk.gray(cmd.alias || '-')]);
      });

      console.log(table.toString());
    });
  }

  // displayShortcuts() method removed - keyboard shortcuts no longer displayed

  displayQuickStart() {
    console.log(this.creaiteGradient('\n━━━ QUICK START ━━━\n'));

    const examples = [
      {
        title: '🚀 Start your day',
        commands: [
          'cx live          # Open live dashboard',
          'cx next          # See what to work on',
          'cx build TASK-001  # Smart build a task',
        ],
      },
      {
        title: '📊 Check progress',
        commands: [
          'cx status        # Beautiful progress report',
          'cx dashboard     # Open HTML dashboard',
          'cx sprint        # View sprint status',
        ],
      },
      {
        title: '✨ Manage tasks',
        commands: [
          'cx add "New feature"  # Create task',
          'cx build TASK-001     # Smart task builder',
          'cx list               # View all tasks',
        ],
      },
      {
        title: '🎬 Live monitoring',
        commands: [
          'cx ticker            # Watch live activity feed',
          'cx live              # Live dashboard updates',
          'cx status            # Generate progress report',
        ],
      },
    ];

    examples.forEach((example) => {
      console.log(chalk.bold.white(`  ${example.title}\n`));
      example.commands.forEach((cmd) => {
        const [command, description] = cmd.split('#').map((s) => s.trim());
        console.log('    ' + chalk.cyan(command.padEnd(25)) + chalk.gray('# ' + description));
      });
      console.log();
    });
  }

  displayTips() {
    console.log(
      boxen(
        chalk.bold.yellow('💡 Pro Tips:\n\n') +
          chalk.white('1. Use ') +
          chalk.cyan.bold('cx live') +
          chalk.white(' for real-time task tracking\n') +
          chalk.white('2. Press ') +
          chalk.yellow.bold('1-5') +
          chalk.white(' in live dashboard to switch view modes\n') +
          chalk.white('3. Use ') +
          chalk.cyan.bold('cx build [ID]') +
          chalk.white(' for AI-powered smart task building\n') +
          chalk.white('4. Run ') +
          chalk.cyan.bold('cx dashboard') +
          chalk.white(' to see beautiful Gantt charts\n') +
          chalk.white('5. Use ') +
          chalk.cyan.bold('cx next') +
          chalk.white(' to get AI-powered task recommendations\n') +
          chalk.white('6. Run ') +
          chalk.cyan.bold('cx test [ID]') +
          chalk.white(' to test specific task implementations'),
        {
          padding: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
        }
      )
    );
  }

  displayFooter() {
    console.log('\n' + chalk.gray('─'.repeat(80)));
    console.log(
      chalk.gray('Version: ') +
        chalk.white('1.0.0') +
        chalk.gray(' | ') +
        chalk.gray('Docs: ') +
        chalk.cyan('https://github.com/schoolcierge') +
        chalk.gray(' | ') +
        chalk.gray('Made with ') +
        chalk.red('♥') +
        chalk.gray(' by ') +
        this.tealGradient('CREAITE')
    );
    console.log();
  }

  run() {
    this.displayHeader();
    this.displayCommands();
    // Keyboard shortcuts display removed
    this.displayQuickStart();
    this.displayTips();
    this.displayFooter();
  }
}

// Run the help
const help = new SexyHelp();
help.run();
