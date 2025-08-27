#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';

// Enhanced colors including bold and teal
const colors = {
  blue: chalk.hex('#2563eb'),
  purple: chalk.hex('#7c3aed'),
  gold: chalk.hex('#f59e0b'),
  green: chalk.hex('#059669'),
  orange: chalk.hex('#d97706'),
  red: chalk.hex('#dc2626'),
  gray: chalk.hex('#374151'),
  muted: chalk.hex('#6b7280'),
  teal: chalk.hex('#0d9488'),          // Teal color
  boldTeal: chalk.hex('#0d9488').bold, // Bold teal
  boldGold: chalk.hex('#f59e0b').bold, // Bold gold
};

/**
 * Apply special styling for Digital font - Bold Teal with Gold AI
 */
function applyDigitalStyling(text) {
  return text.split('\n').map(line => {
    let coloredLine = line;
    
    // For the Digital font format: |C|R|E|A|I|T|E|
    // We need to identify and color each letter individually
    if (line.includes('|') && (line.includes('A') || line.includes('I') || line.includes('C') || line.includes('R') || line.includes('E') || line.includes('T'))) {
      // Color each letter based on position
      // The Digital format is: |C|R|E|A|I|T|E|
      // We want: CRE in teal, AI in gold, TE in teal
      coloredLine = line
        .replace(/\|C\|/g, `|${colors.boldTeal('C')}|`)
        .replace(/\|R\|/g, `|${colors.boldTeal('R')}|`)
        .replace(/\|E\|/g, (match, offset, string) => {
          // Check if this E is part of TE (at the end) or CRE (at the beginning)
          if (string.indexOf(match) > string.indexOf('|I|')) {
            // This is the final E in TE
            return `|${colors.boldTeal('E')}|`;
          } else {
            // This is the E in CRE
            return `|${colors.boldTeal('E')}|`;
          }
        })
        .replace(/\|A\|/g, `|${colors.boldGold('A')}|`)
        .replace(/\|I\|/g, `|${colors.boldGold('I')}|`)
        .replace(/\|T\|/g, `|${colors.boldTeal('T')}|`);
    }
    
    // Color the border elements (+ and - characters)
    coloredLine = coloredLine
      .replace(/\+/g, colors.boldTeal('+'))
      .replace(/-/g, colors.boldTeal('-'));
    
    return coloredLine;
  }).join('\n');
}

/**
 * Apply clean styling for Fire Font-k (remove decorative elements)
 */
function applyCleanFireFontStyling(text) {
  return text.split('\n').map(line => {
    // Remove or minimize the decorative "fire" elements
    // Keep only the core letter shapes
    let cleanLine = line;
    
    // Remove excessive parentheses and decorative characters at the beginning
    if (line.trim().startsWith('(') && line.includes(')') && !line.includes('_')) {
      // Skip purely decorative lines
      return '';
    }
    
    // Color the meaningful content - emphasize AI in gold, rest in blue
    if (line.includes('_') || line.includes('|') || line.includes('/') || line.includes('\\')) {
      // This looks like actual letter content
      // Apply brand colors with AI emphasis
      cleanLine = line
        .replace(/AI/gi, colors.gold('AI'))
        .replace(/(CRE|TE)/gi, colors.blue('$1'));
      
      // If no direct letter matches, apply blue to the whole line
      if (!line.match(/(CRE|AI|TE)/gi)) {
        cleanLine = colors.blue(line);
      }
    }
    
    return cleanLine;
  }).filter(line => line.trim() !== '').join('\n'); // Remove empty lines
}

/**
 * Display specific font tests
 */
function testSpecificFonts() {
  console.log(colors.purple('🔍 FOCUSED FONT TESTS'));
  console.log(colors.muted('Testing specific fonts with custom styling\n'));

  // Test 1: Fire Font-k without decorative fire elements
  console.log('='.repeat(80));
  console.log(colors.purple('TEST 1: Fire Font-k (Cleaned up - no decorative "fire")'));
  console.log('='.repeat(80));
  
  try {
    const fireText = figlet.textSync('CREAITE', {
      font: 'Fire Font-k',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    });
    
    console.log('Original Fire Font-k:');
    console.log(colors.gray(fireText));
    
    console.log('\nCleaned Fire Font-k (decorative elements removed):');
    const cleanedFireText = applyCleanFireFontStyling(fireText);
    console.log(cleanedFireText);
    
    // Show dimensions
    const fireLines = cleanedFireText.split('\n').filter(line => line.trim());
    const fireWidth = Math.max(...fireLines.map(line => line.replace(/\u001b\[[0-9;]*m/g, '').length));
    console.log(colors.muted(`\nDimensions: ${fireWidth} chars wide × ${fireLines.length} lines tall`));
    
  } catch (error) {
    console.log(colors.red(`Error with Fire Font-k: ${error.message}`));
  }

  // Test 2: Digital with Bold Teal and Gold AI
  console.log('\n' + '='.repeat(80));
  console.log(colors.purple('TEST 2: Digital Font (Bold Teal with Gold AI)'));
  console.log('='.repeat(80));
  
  try {
    const digitalText = figlet.textSync('CREAITE', {
      font: 'Digital',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    });
    
    console.log('Original Digital:');
    console.log(colors.gray(digitalText));
    
    console.log('\nStyled Digital (Bold Teal + Gold AI):');
    const styledDigitalText = applyDigitalStyling(digitalText);
    console.log(styledDigitalText);
    
    // Show dimensions
    const digitalLines = digitalText.split('\n').filter(line => line.trim());
    const digitalWidth = Math.max(...digitalLines.map(line => line.length));
    console.log(colors.muted(`\nDimensions: ${digitalWidth} chars wide × ${digitalLines.length} lines tall`));
    
  } catch (error) {
    console.log(colors.red(`Error with Digital: ${error.message}`));
  }

  // Comparison summary
  console.log('\n' + '='.repeat(80));
  console.log(colors.purple('COMPARISON SUMMARY'));
  console.log('='.repeat(80));
  
  console.log(colors.boldTeal('Digital Font Pros:'));
  console.log('  ✅ Ultra compact (16w × 3h)');
  console.log('  ✅ Very unique grid/box aesthetic');
  console.log('  ✅ Perfect for tech/coding themes');
  console.log('  ✅ Bold styling works great');
  console.log('  ✅ Easy to apply colors to individual letters');
  
  console.log(colors.blue('\nCleaned Fire Font-k Pros:'));
  console.log('  ✅ More traditional ASCII art feel');
  console.log('  ✅ Good readability when cleaned up');
  console.log('  ✅ Interesting letter shapes');
  console.log('  ⚠️  Still quite tall even when cleaned');
  console.log('  ⚠️  More complex to style consistently');

  console.log(colors.gold('\n🎯 RECOMMENDATION:'));
  console.log('The ' + colors.boldTeal('Digital') + ' font with bold teal and gold AI looks fantastic!');
  console.log('It\'s ultra-compact and the grid aesthetic fits perfectly with CLI/coding tools.');
  console.log('The cleaned Fire Font-k is interesting but still quite large for a compact banner.');
}

// Run the focused tests
testSpecificFonts();
