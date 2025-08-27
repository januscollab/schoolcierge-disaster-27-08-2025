#!/usr/bin/env node

// ANSI color codes for terminal display
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colors
  teal: '\x1b[36m',  // darker teal/cyan
  cyan: '\x1b[36m',   // using regular cyan instead of bright
  gold: '\x1b[33m',   // standard yellow/gold - more visible
  magenta: '\x1b[35m',
  purple: '\x1b[95m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  yellow: '\x1b[33m',  // matching gold
  
  // Backgrounds
  bgTeal: '\x1b[46m',
  bgMagenta: '\x1b[45m',
  bgDark: '\x1b[40m'
};

console.clear();

// Main banner display
console.log('\n' + colors.yellow + colors.bright + '══════════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.yellow + colors.bright + '                      CREAITE LOGO DISPLAY                     ' + colors.reset);
console.log(colors.yellow + colors.bright + '══════════════════════════════════════════════════════════════' + colors.reset + '\n');

// ASCII Art Logo with AI emphasis
console.log(colors.cyan + colors.bright + '\n▶ Main Banner (UPPERCASE - Banner Context Only):' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');

// The banner with colored AI portion
const banner = [
  '     ██████╗██████╗ ███████╗ █████╗ ██╗████████╗███████╗',
  '    ██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝',
  '    ██║     ██████╔╝█████╗  ███████║██║   ██║   █████╗  ',
  '    ██║     ██╔══██╗██╔══╝  ██╔══██║██║   ██║   ██╔══╝  ',
  '    ╚██████╗██║  ██║███████╗██║  ██║██║   ██║   ███████╗',
  '     ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝'
];

// Display banner with colored sections
banner.forEach(line => {
  // Looking at the actual structure:
  // CRE: characters 5-28 (██████╗██████╗ ███████╗)
  // AI:  characters 29-39 (█████╗ ██╗)
  // TE:  characters 40-end (████████╗███████╗)
  
  if (line.trim().length === 0) {
    console.log(line);
  } else {
    // Proper boundaries for CRE-AI-TE split
    const creaPart = line.substring(0, 28);
    const aiPart = line.substring(28, 39);
    const tePart = line.substring(39);
    
    console.log(
      colors.cyan + colors.bright + creaPart + colors.reset +
      colors.gold + colors.bright + aiPart + colors.reset +
      colors.cyan + colors.bright + tePart + colors.reset
    );
  }
});

console.log('');
console.log(colors.gray + colors.dim + '                    where ideas become reality' + colors.reset);
console.log('');

// Text variations
console.log(colors.cyan + colors.bright + '\n▶ Text Variations (lowercase - Standard Usage):' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');

console.log('  Standard:         ' + colors.white + 'creaite' + colors.reset);
console.log('  With AI emphasis: ' + colors.cyan + colors.bright + 'cre' + colors.gold + colors.bright + 'ai' + colors.cyan + colors.bright + 'te' + colors.reset);
console.log('  Markdown:         cre**ai**te');
console.log('  Bracketed:        cre[ai]te');
console.log('  In context:       ' + colors.gray + 'Welcome to ' + colors.white + 'creaite' + colors.gray + ', your AI creative partner' + colors.reset);

// Alternative compact display
console.log(colors.cyan + colors.bright + '\n▶ Compact Inline Display:' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');

// Box drawing characters for a simple frame
const boxTop = '  ┌──────────┐';
const boxMid = '  │ ' + colors.cyan + colors.bright + 'cre' + colors.gold + colors.bright + 'ai' + colors.cyan + colors.bright + 'te' + colors.reset + colors.gray + ' │';
const boxBot = '  └──────────┘';

console.log(colors.gray + boxTop);
console.log(colors.gray + boxMid);
console.log(colors.gray + boxBot + colors.reset);

// Usage examples
console.log(colors.cyan + colors.bright + '\n▶ Brand Usage Examples:' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');

console.log('  File naming:      ' + colors.white + 'creaite-logo.svg' + colors.gray + ' (always lowercase)' + colors.reset);
console.log('  Social media:     ' + colors.white + '@creaite' + colors.gray + ' (no capitals)' + colors.reset);
console.log('  Hashtags:         ' + colors.white + '#creaite #creaiteai' + colors.gray + ' (no capitals)' + colors.reset);
console.log('  Domain:           ' + colors.white + 'creaite.ai' + colors.gray + ' or ' + colors.white + 'creaite.com' + colors.reset);
console.log('  In sentences:     ' + colors.gray + '"Built with ' + colors.white + 'creaite' + colors.gray + ' technology"' + colors.reset);

// Rules reminder
console.log(colors.cyan + colors.bright + '\n▶ Key Brand Rules:' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');

console.log('  ' + colors.bright + '1.' + colors.reset + ' Always lowercase except in banners: ' + colors.white + 'creaite' + colors.reset);
console.log('  ' + colors.bright + '2.' + colors.reset + ' UPPERCASE only for ASCII art: ' + colors.white + 'CREAITE' + colors.reset);
console.log('  ' + colors.bright + '3.' + colors.reset + ' Emphasize the AI portion when possible');
console.log('  ' + colors.bright + '4.' + colors.reset + ' Never split or hyphenate the word');
console.log('  ' + colors.bright + '5.' + colors.reset + ' Pronunciation: /kree-AY-t/ (emphasis on AI)');

console.log('\n' + colors.yellow + colors.bright + '══════════════════════════════════════════════════════════════' + colors.reset);
console.log('');

// Also create a clean version for copying
console.log(colors.cyan + colors.bright + '▶ Clean ASCII for copying:' + colors.reset);
console.log(colors.gray + '────────────────────────────────────────────────────────────────' + colors.reset);
console.log('');
console.log('Standard Banner:');
console.log('');
banner.forEach(line => console.log(line));
console.log('');
console.log('                    where ideas become reality');
console.log('');
