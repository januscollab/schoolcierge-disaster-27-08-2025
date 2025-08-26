#!/usr/bin/env node

const gradient = require('gradient-string');
const figlet = require('figlet');
const boxenLib = require('boxen');
const boxen = boxenLib.default || boxenLib;

// ANSI color codes for fallback
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m'
};

class CreaiteBrand {
  constructor() {
    // Teal-focused gradients with AI highlight
    this.tealGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6']);
    this.aiGradient = gradient(['#fbbf24', '#f59e0b', '#fb923c']); // Gold/amber for AI
    this.brandGradient = gradient(['#0891b2', '#06b6d4', '#14b8a6', '#10b981']);
    this.accentGradient = gradient(['#06b6d4', '#0ea5e9']);
  }

  displayLogo(subtitle = 'Task Management Framework') {
    console.clear();
    
    // Create the main logo with special AI treatment
    console.log('\n');
    
    // Stylized ASCII art for lowercase "creaite" with AI emphasis
    const logo = `
    ${this.tealGradient('                                             ')}
    ${this.tealGradient('     ██████╗██████╗ ███████╗')}${this.aiGradient(' █████╗ ██╗')}${this.tealGradient('████████╗███████╗')}
    ${this.tealGradient('    ██╔════╝██╔══██╗██╔════╝')}${this.aiGradient('██╔══██╗██║')}${this.tealGradient('╚══██╔══╝██╔════╝')}
    ${this.tealGradient('    ██║     ██████╔╝█████╗  ')}${this.aiGradient('███████║██║')}${this.tealGradient('   ██║   █████╗  ')}
    ${this.tealGradient('    ██║     ██╔══██╗██╔══╝  ')}${this.aiGradient('██╔══██║██║')}${this.tealGradient('   ██║   ██╔══╝  ')}
    ${this.tealGradient('    ╚██████╗██║  ██║███████╗')}${this.aiGradient('██║  ██║██║')}${this.tealGradient('   ██║   ███████╗')}
    ${this.tealGradient('     ╚═════╝╚═╝  ╚═╝╚══════╝')}${this.aiGradient('╚═╝  ╚═╝╚═╝')}${this.tealGradient('   ╚═╝   ╚══════╝')}
    
    ${colors.gray}    ╔═══════════════════════════════════════════════════════════╗${colors.reset}
    ${colors.gray}    ║${colors.reset}     ${colors.bold}${this.tealGradient('cre')}${this.aiGradient('ai')}${this.tealGradient('te')}${colors.reset} - ${colors.italic}${colors.white}where creativity meets intelligence${colors.reset}     ${colors.gray}║${colors.reset}
    ${colors.gray}    ╚═══════════════════════════════════════════════════════════╝${colors.reset}`;
    
    console.log(logo);
    
    // Subtitle with styling
    console.log(
      boxen(
        `${colors.bold}${colors.white}${subtitle}${colors.reset}`,
        {
          padding: { left: 2, right: 2, top: 0, bottom: 0 },
          margin: { top: 1, bottom: 1 },
          borderStyle: 'round',
          borderColor: 'cyan',
          align: 'center'
        }
      )
    );

    // Tagline
    console.log(
      `${colors.italic}${colors.gray}        Powered by ${colors.reset}` + 
      this.aiGradient.multiline('Artificial Intelligence') + 
      `${colors.italic}${colors.gray} • Built with ${colors.reset}` + 
      this.tealGradient.multiline('Love')
    );
  }

  displayCompactLogo() {
    // Compact version for command outputs
    const logo = `${colors.bold}${this.tealGradient('cre')}${this.aiGradient('ai')}${this.tealGradient('te')}${colors.reset}`;
    return logo;
  }

  displayMinimalLogo() {
    // Even more minimal for inline use
    return `[${this.tealGradient('cre')}${this.aiGradient('ai')}${this.tealGradient('te')}]`;
  }

  getTheme() {
    return {
      // Color functions using ANSI codes
      primary: (text) => `${colors.cyan}${text}${colors.reset}`,
      secondary: (text) => `\x1b[96m${text}${colors.reset}`, // Light cyan
      accent: (text) => `${colors.yellow}${text}${colors.reset}`,
      success: (text) => `${colors.green}${text}${colors.reset}`,
      warning: (text) => `\x1b[93m${text}${colors.reset}`, // Light yellow
      error: (text) => `${colors.red}${text}${colors.reset}`,
      info: (text) => `\x1b[94m${text}${colors.reset}`, // Light blue
      muted: (text) => `${colors.gray}${text}${colors.reset}`,
      
      // Gradients
      brandGradient: this.brandGradient,
      tealGradient: this.tealGradient,
      aiGradient: this.aiGradient,
      
      // Semantic colors
      heading: (text) => `${colors.bold}${colors.cyan}${text}${colors.reset}`,
      subheading: (text) => `\x1b[96m${text}${colors.reset}`,
      text: (text) => `${colors.white}${text}${colors.reset}`,
      dim: (text) => `${colors.gray}${text}${colors.reset}`,
      
      // Status colors
      statusColors: {
        'completed': (text) => `${colors.green}${text}${colors.reset}`,
        'in-progress': (text) => `${colors.yellow}${text}${colors.reset}`,
        'blocked': (text) => `${colors.red}${text}${colors.reset}`,
        'not-started': (text) => `${colors.gray}${text}${colors.reset}`
      }
    };
  }
}

// Export for use in other modules
module.exports = CreaiteBrand;

// If run directly, show the logo
if (require.main === module) {
  const brand = new CreaiteBrand();
  brand.displayLogo('🚀 Task Management Superpower System');
  
  console.log(`\n\n${colors.gray}${'━'.repeat(60)}${colors.reset}`);
  console.log(`\n${colors.bold}  Compact Logo: ${colors.reset}` + brand.displayCompactLogo());
  console.log(`\n${colors.bold}  Minimal Logo: ${colors.reset}` + brand.displayMinimalLogo());
  
  const theme = brand.getTheme();
  console.log(`\n${colors.gray}${'━'.repeat(60)}${colors.reset}`);
  console.log(`\n${colors.bold}  Theme Colors:${colors.reset}`);
  console.log('  ' + theme.primary('Primary (Cyan)') + '  ' + 
              theme.accent('Accent (AI Gold)') + '  ' + 
              theme.success('Success') + '  ' + 
              theme.error('Error'));
  
  console.log('\n');
}