#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';

// Colors
const colors = {
  boldTeal: chalk.hex('#0d9488').bold,
  boldGold: chalk.hex('#f59e0b').bold,
  blue: chalk.hex('#2563eb'),
  gold: chalk.hex('#f59e0b'),
  gray: chalk.hex('#6b7280'),
};

console.log(colors.boldTeal('🎨 EXACT COLOR PREVIEW\n'));

// Digital Font with Bold Teal + Gold AI
const digitalText = figlet.textSync('CREAITE', { font: 'Digital' });
console.log('DIGITAL FONT - Bold Teal with Gold AI:');
console.log('=====================================');

// Apply exact colors
const styledDigital = digitalText
  .split('\n')
  .map(line => {
    if (!line.includes('|')) {
      return colors.boldTeal(line); // Border lines
    }
    // Letter line: |C|R|E|A|I|T|E|
    return line
      .replace(/\|C\|/g, `|${colors.boldTeal('C')}|`)
      .replace(/\|R\|/g, `|${colors.boldTeal('R')}|`)
      .replace(/\|E\|/g, `|${colors.boldTeal('E')}|`)
      .replace(/\|A\|/g, `|${colors.boldGold('A')}|`)
      .replace(/\|I\|/g, `|${colors.boldGold('I')}|`)
      .replace(/\|T\|/g, `|${colors.boldTeal('T')}|`);
  })
  .join('\n');

console.log(styledDigital);
console.log(colors.gray('\n16 chars wide × 3 lines tall\n'));

// Fire Font-k cleaned version
const fireText = figlet.textSync('CREAITE', { font: 'Fire Font-k' });
console.log('FIRE FONT-K - Blue with Gold AI (decorative elements removed):');
console.log('==============================================================');

// Clean version - remove top decorative lines and apply colors
const cleanedFireLines = fireText
  .split('\n')
  .slice(4) // Skip first 4 decorative lines
  .map(line => {
    if (line.includes('_') || line.includes('|')) {
      // Apply colors to readable parts
      return line
        .replace(/\| _/g, colors.blue('| _'))
        .replace(/_\|/g, colors.blue('_|'))
        .replace(/\|_/g, colors.blue('|_'))
        .replace(/__/g, colors.blue('__'))
        .replace(/\\\\/g, colors.blue('\\\\'))
        .replace(/\//g, colors.blue('/'))
        .replace(/\|/g, colors.blue('|'))
        .replace(/ _/g, colors.blue(' _'))
        .replace(/AI/g, colors.gold('AI')) // Highlight AI in gold
        .replace(/\(__/g, colors.blue('(__'))
        .replace(/___\)/g, colors.blue('___)'))
        .replace(/\(_\)/g, colors.blue('(_)'))
        .replace(/ \\\\\\_/g, colors.blue(' \\\\_'));
    }
    return colors.blue(line);
  })
  .join('\n');

console.log(cleanedFireLines);
console.log(colors.gray('\n~40 chars wide × 4-5 lines tall (after cleanup)\n'));

// Side by side comparison
console.log(colors.boldTeal('SIDE BY SIDE COMPARISON:'));
console.log('========================');
console.log(colors.boldTeal('Digital (Ultra Compact)      ') + colors.blue('Fire Font-k (Cleaned)'));
console.log(colors.gray('16w × 3h                      ') + colors.gray('40w × 5h'));
console.log('');

const digitalLines = styledDigital.split('\n');
const fireCleanedLines = cleanedFireLines.split('\n');
const maxLines = Math.max(digitalLines.length, fireCleanedLines.length);

for (let i = 0; i < maxLines; i++) {
  const digitalLine = digitalLines[i] || '';
  const fireLine = fireCleanedLines[i] || '';
  
  // Pad digital line to align with fire font
  const paddedDigitalLine = digitalLine.padEnd(30);
  console.log(paddedDigitalLine + '    ' + fireLine);
}

console.log('\n' + colors.boldGold('SUMMARY:'));
console.log('Digital = Perfect for ultra-compact CLI banners');
console.log('Fire Font-k = More artistic but takes more space');
