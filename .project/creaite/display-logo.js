#!/usr/bin/env node

import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';

// Define our custom gradients
const cyanGradient = gradient(['#115e59', '#0e7490']); // darker teal range
const aiGradient = gradient(['#b45309', '#f59e0b']); // richer gold/amber
const coolGradient = gradient(['#667eea', '#764ba2']);

console.clear();

// Display function for the main logo
function displayMainLogo() {
  console.log('\n');
  
  // Main ASCII banner
  const banner = `
     ██████╗██████╗ ███████╗ █████╗ ██╗████████╗███████╗
    ██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝
    ██║     ██████╔╝█████╗  ███████║██║   ██║   █████╗  
    ██║     ██╔══██╗██╔══╝  ██╔══██║██║   ██║   ██╔══╝  
    ╚██████╗██║  ██║███████╗██║  ██║██║   ██║   ███████╗
     ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝`;

  // Split the banner to apply different colors to AI section
  const lines = banner.split('\n');
  
  lines.forEach(line => {
    // Fixed boundaries for CRE-AI-TE split (same as simple-logo.js)
    const creaPart = line.substring(0, 28);
    const aiPart = line.substring(28, 39);
    const tePart = line.substring(39);
    
    console.log(
      cyanGradient(creaPart) + 
      aiGradient(aiPart) + 
      cyanGradient(tePart)
    );
  });
  
  // Tagline
  console.log('\n');
  console.log(chalk.gray.italic('                    where ideas become reality'));
  console.log('\n');
}

// Alternative stylized version
function displayStylizedLogo() {
  // Render the entire word to avoid gaps
  const opts = { font: 'Slant', horizontalLayout: 'default', verticalLayout: 'default', width: 80, whitespaceBreak: true };
  const fullLogo = figlet.textSync('creaite', opts).split('\n');
  
  const teal = (s) => chalk.hex('#0e7490').bold(s);
  
  // Apply single teal color to entire figlet text - simple and clean
  const colored = fullLogo.map(line => teal(line));

  console.log(boxen(colored.join('\n'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: 'creaite',
    titleAlignment: 'center'
  }));
}

// Compact ASCII banner for reports and dashboards
function displayCompactBanner() {
  console.log('\n');
  
  // Compact ASCII banner (3 lines instead of 6)
  const compactBanner = `
 ██████╗██████╗ ███████╗ █████╗ ██╗████████╗███████╗
██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝
╚██████╗██║  ██║███████╗██║  ██║██║   ██║   ███████╗`;

  // Split the banner to apply different colors to AI section
  const lines = compactBanner.split('\n');
  
  lines.forEach(line => {
    if (line.trim() === '') {
      console.log(line);
      return;
    }
    
    // Same boundaries as main banner but for compact version
    const creaPart = line.substring(0, 28);
    const aiPart = line.substring(28, 39);
    const tePart = line.substring(39);
    
    console.log(
      cyanGradient(creaPart) + 
      aiGradient(aiPart) + 
      cyanGradient(tePart)
    );
  });
  
  console.log('\n');
}

// Minimal version for inline use
function displayMinimalLogo() {
  console.log('\n');
  const text = 'creaite';
  const styled = 
    chalk.hex('#0e7490').bold('cre') + 
    chalk.hex('#f59e0b').bold('ai') + 
    chalk.hex('#0e7490').bold('te');
  
  console.log(boxen(styled, {
    padding: { top: 0, right: 2, bottom: 0, left: 2 },
    borderStyle: 'single',
    borderColor: 'gray'
  }));
}

// Display all versions
console.log(chalk.yellow.bold('\n══════════════════════════════════════════════════════════'));
console.log(chalk.yellow.bold('                    CREAITE LOGO VARIANTS                  '));
console.log(chalk.yellow.bold('══════════════════════════════════════════════════════════\n'));

console.log(chalk.cyan.bold('\n▶ Variant 1: Main ASCII Banner (UPPERCASE for banners only)'));
console.log(chalk.gray('────────────────────────────────────────────────────────────'));
displayMainLogo();

console.log(chalk.cyan.bold('\n▶ Variant 2: Stylized Figlet Version (lowercase)'));
console.log(chalk.gray('────────────────────────────────────────────────────────────'));
displayStylizedLogo();

console.log(chalk.cyan.bold('\n▶ Variant 3: Compact Banner (UPPERCASE for reports/dashboards)'));
console.log(chalk.gray('────────────────────────────────────────────────────────────'));
displayCompactBanner();

console.log(chalk.cyan.bold('\n▶ Variant 4: Minimal Inline Version (lowercase with AI emphasis)'));
console.log(chalk.gray('────────────────────────────────────────────────────────────'));
displayMinimalLogo();

// Show text variations
console.log(chalk.cyan.bold('\n▶ Variant 5: Text Representations'));
console.log(chalk.gray('────────────────────────────────────────────────────────────'));
console.log('\n  Regular text:        ', chalk.hex('#0e7490')('cre') + chalk.hex('#f59e0b').bold('ai') + chalk.hex('#0e7490')('te'));
console.log('  With AI emphasis:    ', chalk.hex('#0e7490').bold('cre') + chalk.hex('#f59e0b').bold('ai') + chalk.hex('#0e7490').bold('te'));
console.log('  Markdown emphasis:   ', 'cre**ai**te');
console.log('  Bracket emphasis:    ', 'cre[ai]te');
console.log('  In a sentence:       ', chalk.gray('Welcome to'), chalk.white('creaite') + chalk.gray(', where ideas come to life'));

console.log(chalk.yellow.bold('\n══════════════════════════════════════════════════════════\n'));

// Export functions for use in other modules
export { displayMainLogo, displayStylizedLogo, displayCompactBanner, displayMinimalLogo };
