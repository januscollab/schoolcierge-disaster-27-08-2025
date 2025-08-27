#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';

// Brand colors from the design guide
const BRAND_COLORS = {
  primary: '#2563eb',     // Blue
  secondary: '#7c3aed',   // Purple  
  accent: '#f59e0b',      // Gold/Amber
  success: '#059669',     // Emerald
  warning: '#d97706',     // Orange
  error: '#dc2626',       // Red
  text: '#374151',        // Gray-700
  muted: '#6b7280'        // Gray-500
};

// Convert hex colors to chalk colors (approximate)
const colors = {
  blue: chalk.hex('#2563eb'),
  purple: chalk.hex('#7c3aed'),
  gold: chalk.hex('#f59e0b'),
  green: chalk.hex('#059669'),
  orange: chalk.hex('#d97706'),
  red: chalk.hex('#dc2626'),
  gray: chalk.hex('#374151'),
  muted: chalk.hex('#6b7280')
};

// Compact fonts suitable for terminal banners
const COMPACT_FONTS = [
  'Standard',      // Classic, readable
  'Small',         // Very compact
  'Mini',          // Tiny but readable
  'Digital',       // Digital look
  'Slant',         // Italic style
  'Speed',         // Fast/modern look
  'Chunky',        // Bold but compact
  'Cosmike',       // Space-age look
  'Crawford2',     // Elegant serif
  'Doom',          // Gaming style
  'Elite',         // Professional
  'Fire Font-k',   // Stylized
  'Fire Font-s',   // Smaller stylized
  'Graceful',      // Elegant
  'Graffiti',      // Street art style
  'Henry 3D',      // 3D effect
  'Isometric1',    // 3D isometric
  'Larry 3D',      // 3D block style
  'Lean',          // Minimal/clean
  'Letters',       // Simple letters
  'ANSI Shadow',   // Shadow effect
  'Block',         // Solid blocks
  'Rectangles',    // Geometric
  'Rounded',       // Soft edges
  'Small Slant'    // Compact italic
];

/**
 * Apply brand coloring to CREAITE text
 * Emphasizes 'AI' portion in gold, rest in blue
 */
function applyBrandColors(text) {
  // Split each line and apply colors
  return text.split('\n').map(line => {
    // Replace CREAITE pattern with colored version
    // This is a simple approach - color 'CRE' in blue, 'AI' in gold, 'TE' in blue
    let coloredLine = line;
    
    // For ASCII art, we need to be more careful about character-by-character coloring
    // This is a simplified approach that works for most fonts
    if (line.includes('CRE') || line.includes('AI') || line.includes('TE')) {
      // Try to identify and color the AI portion differently
      coloredLine = line
        .replace(/AI/g, colors.gold('AI'))
        .replace(/CRE/g, colors.blue('CRE'))
        .replace(/TE/g, colors.blue('TE'));
    } else {
      // For ASCII art characters that don't contain readable letters,
      // apply a gradient-like effect or keep it simple
      coloredLine = colors.blue(line);
    }
    
    return coloredLine;
  }).join('\n');
}

/**
 * Generate and display logo with specified font
 */
function displayLogoWithFont(fontName) {
  console.log('\n' + '='.repeat(80));
  console.log(colors.purple(`FONT: ${fontName}`));
  console.log('='.repeat(80));
  
  try {
    const asciiText = figlet.textSync('CREAITE', {
      font: fontName,
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 120,
      whitespaceBreak: true
    });
    
    if (asciiText) {
      const coloredText = applyBrandColors(asciiText);
      console.log(coloredText);
      
      // Show dimensions info
      const lines = asciiText.split('\n').filter(line => line.trim());
      const maxWidth = Math.max(...lines.map(line => line.length));
      console.log(colors.muted(`\nDimensions: ${maxWidth} chars wide × ${lines.length} lines tall`));
    }
  } catch (error) {
    console.log(colors.red(`Error with font ${fontName}: ${error.message}`));
  }
}

/**
 * Display a compact comparison of all fonts
 */
function displayCompactComparison() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.purple('COMPACT COMPARISON - All Fonts Side by Side'));
  console.log('='.repeat(80));
  
  COMPACT_FONTS.forEach((font, index) => {
    try {
      const asciiText = figlet.textSync('CREAITE', {
        font: font,
        horizontalLayout: 'default',
        verticalLayout: 'default'
      });
      
      if (asciiText) {
        const lines = asciiText.split('\n').filter(line => line.trim());
        const maxWidth = Math.max(...lines.map(line => line.length));
        
        // Show just the font name and first line for quick comparison
        const firstLine = lines[0] || '';
        const coloredFirstLine = applyBrandColors(firstLine);
        
        console.log(`${colors.muted((index + 1).toString().padStart(2))}. ${font.padEnd(20)} | ${coloredFirstLine}`);
        console.log(`    ${colors.muted(`${maxWidth}w × ${lines.length}h`)}`);
      }
    } catch (error) {
      console.log(`${colors.muted((index + 1).toString().padStart(2))}. ${font.padEnd(20)} | ${colors.red('Error: ' + error.message)}`);
    }
  });
}

/**
 * Show recommended fonts for different use cases
 */
function showRecommendations() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.purple('RECOMMENDATIONS FOR DIFFERENT USE CASES'));
  console.log('='.repeat(80));
  
  const recommendations = {
    'Ultra Compact (≤3 lines)': ['Small', 'Mini', 'Letters'],
    'Compact & Professional': ['Standard', 'Elite', 'Lean'],
    'Modern & Stylish': ['Slant', 'Speed', 'ANSI Shadow'],
    'Bold & Impactful': ['Chunky', 'Block', 'Henry 3D'],
    'Creative & Unique': ['Digital', 'Graffiti', 'Fire Font-s']
  };
  
  Object.entries(recommendations).forEach(([category, fonts]) => {
    console.log(`\n${colors.gold(category)}:`);
    fonts.forEach(font => {
      console.log(`  • ${colors.blue(font)}`);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log(colors.gold('🎨 CREAITE Logo Font Experiment'));
  console.log(colors.muted('Testing various figlet fonts for the perfect compact banner\n'));
  
  // Check available fonts
  try {
    const availableFonts = figlet.fontsSync();
    console.log(colors.green(`✓ Found ${availableFonts.length} available fonts`));
    
    // Filter our test fonts to only include available ones
    const testFonts = COMPACT_FONTS.filter(font => availableFonts.includes(font));
    console.log(colors.blue(`📝 Testing ${testFonts.length} compact fonts...\n`));
    
    // Display each font in detail
    testFonts.forEach(displayLogoWithFont);
    
    // Show compact comparison
    displayCompactComparison();
    
    // Show recommendations
    showRecommendations();
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log(colors.gold('🎯 EXPERIMENT COMPLETE'));
    console.log('='.repeat(80));
    console.log(colors.blue('Review the outputs above to select your preferred font.'));
    console.log(colors.muted('Consider: readability, width, height, and visual impact.'));
    console.log(colors.green('\nOnce decided, we can integrate the chosen font into display-logo.js'));
    
  } catch (error) {
    console.error(colors.red('Error running font experiment:'), error);
  }
}

// Run the experiment
main().catch(console.error);

export {
  displayLogoWithFont,
  applyBrandColors,
  COMPACT_FONTS,
  BRAND_COLORS
};
