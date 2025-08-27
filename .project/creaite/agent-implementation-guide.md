# creaite Logo Implementation Guide for Agents

This document provides **EXACT** code and instructions for implementing creaite branding in dashboards and applications. Follow these guidelines precisely to maintain brand consistency.

## 🎯 Brand Rules Overview

### Core Rules (NEVER violate these)
1. **Lowercase only**: Always use `creaite` in lowercase except in ASCII banners
2. **AI emphasis**: Highlight "ai" portion in gold (#f59e0b) when colors are available
3. **Teal primary**: Use teal (#0e7490) for main brand color
4. **No splitting**: Never hyphenate or split the word (❌ cre-aite, cre aite)

## 📦 Required Dependencies

```javascript
// For Node.js applications
npm install chalk gradient-string figlet boxen

// Import statements
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';
```

## 🎨 Color Palette (Use these exact values)

```javascript
// Brand colors - USE EXACTLY THESE VALUES
const BRAND_COLORS = {
  // Primary teal gradient range
  tealDark: '#115e59',
  tealPrimary: '#0e7490',
  
  // AI accent colors
  goldDark: '#b45309',
  goldPrimary: '#f59e0b',
  
  // Supporting colors
  background: '#111827',
  textLight: '#e5e7eb',
  textWhite: '#ffffff',
  gray: '#6b7280'
};

// Gradient definitions
const cyanGradient = gradient(['#115e59', '#0e7490']);
const aiGradient = gradient(['#b45309', '#f59e0b']);
```

## 🚀 Logo Implementations

### Variant 1: Main ASCII Banner (UPPERCASE - Banners Only)

```javascript
function displayMainLogo() {
  const banner = `
     ██████╗██████╗ ███████╗ █████╗ ██╗████████╗███████╗
    ██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝
    ██║     ██████╔╝█████╗  ███████║██║   ██║   █████╗  
    ██║     ██╔══██╗██╔══╝  ██╔══██║██║   ██║   ██╔══╝  
    ╚██████╗██║  ██║███████╗██║  ██║██║   ██║   ███████╗
     ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝`;

  const lines = banner.split('\n');
  
  lines.forEach(line => {
    // EXACT boundaries - do not modify these numbers
    const creaPart = line.substring(0, 28);
    const aiPart = line.substring(28, 39);
    const tePart = line.substring(39);
    
    console.log(
      cyanGradient(creaPart) + 
      aiGradient(aiPart) + 
      cyanGradient(tePart)
    );
  });
  
  console.log(chalk.gray.italic('                    where ideas become reality'));
}

// Usage: Call this for splash screens, headers, terminal banners
displayMainLogo();
```

### Variant 1b: Compact Banner (UPPERCASE - Reports & Dashboards)

```javascript
function displayCompactBanner() {
  const compactBanner = `
 ██████╗██████╗ ███████╗ █████╗ ██╗████████╗███████╗
██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝
╚██████╗██║  ██║███████╗██║  ██║██║   ██║   ███████╗`;

  const lines = compactBanner.split('\n');
  
  lines.forEach(line => {
    if (line.trim() === '') {
      console.log(line);
      return;
    }
    
    // Same boundaries as main banner - EXACT coordinates
    const creaPart = line.substring(0, 28);
    const aiPart = line.substring(28, 39);
    const tePart = line.substring(39);
    
    console.log(
      cyanGradient(creaPart) + 
      aiGradient(aiPart) + 
      cyanGradient(tePart)
    );
  });
}

// Usage: Call this for reports, dashboards, space-constrained displays
displayCompactBanner();
```

### Variant 2: Stylized Figlet Version (Lowercase - Clean)

```javascript
function displayStylizedLogo() {
  const opts = { 
    font: 'Slant', 
    horizontalLayout: 'default', 
    verticalLayout: 'default', 
    width: 80, 
    whitespaceBreak: true 
  };
  
  const fullLogo = figlet.textSync('creaite', opts).split('\n');
  const teal = (s) => chalk.hex('#0e7490').bold(s);
  
  // Single color - simple and clean
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

// Usage: For stylized displays, about pages, decorative headers
displayStylizedLogo();
```

### Variant 3: Minimal Inline Version (With AI Emphasis)

```javascript
function displayMinimalLogo() {
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

// Usage: For compact displays, navigation headers, inline branding
displayMinimalLogo();
```

### Variant 4: Minimal Inline Version (CAPITALS for Report Headings)

```javascript
function displayReportHeading() {
  const reportTitle = 
    chalk.hex('#0e7490').bold('CRE') + 
    chalk.hex('#f59e0b').bold('AI') + 
    chalk.hex('#0e7490').bold('TE');
  
  console.log(reportTitle);
}

// Usage: For report headings, dashboard titles, and formal document headers
// IMPORTANT: Always consult the designer agent for optimal dashboard/report layouts
displayReportHeading();
```

## 📝 Text Representations

### For Different Contexts

```javascript
// Console/Terminal output
const consoleLogo = chalk.hex('#0e7490').bold('cre') + chalk.hex('#f59e0b').bold('ai') + chalk.hex('#0e7490').bold('te');

// Plain text (no colors available)
const plainText = 'creaite';

// Markdown emphasis
const markdownEmphasis = 'cre**ai**te';

// Bracket emphasis
const bracketEmphasis = 'cre[ai]te';

// In sentences
const inSentence = `Welcome to ${consoleLogo}, where ideas become reality`;

// For file names (always lowercase)
const fileName = 'creaite-dashboard.js';

// For URLs/domains
const domain = 'creaite.ai';

// For social media
const hashtag = '#creaite #creaiteai';
const handle = '@creaite';
```

## 🎛️ Dashboard Integration Examples

### React Component Example

```jsx
import React from 'react';

const CreaiteHeader = () => {
  return (
    <header style={{
      backgroundColor: '#111827',
      padding: '1rem',
      borderBottom: '2px solid #0e7490'
    }}>
      <h1 style={{
        color: '#0e7490',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        margin: 0
      }}>
        cre<span style={{ color: '#f59e0b' }}>ai</span>te
      </h1>
      <p style={{ 
        color: '#6b7280', 
        fontSize: '0.875rem',
        fontStyle: 'italic',
        margin: '0.25rem 0 0 0'
      }}>
        where ideas become reality
      </p>
    </header>
  );
};

export default CreaiteHeader;
```

### CSS Classes

```css
/* creaite Brand CSS - Use exactly these values */
.creaite-brand {
  font-weight: bold;
  color: #0e7490;
}

.creaite-ai-accent {
  color: #f59e0b;
}

.creaite-background {
  background-color: #111827;
}

.creaite-text-light {
  color: #e5e7eb;
}

.creaite-border {
  border-color: #0e7490;
}

/* Usage example */
.creaite-logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.creaite-logo .cre,
.creaite-logo .te {
  color: #0e7490;
}

.creaite-logo .ai {
  color: #f59e0b;
}
```

### HTML Implementation

```html
<!-- Inline logo with proper styling -->
<div class="creaite-logo">
  <span class="cre">cre</span><span class="ai">ai</span><span class="te">te</span>
</div>

<!-- With tagline -->
<div class="creaite-header">
  <h1 class="creaite-logo">
    <span class="cre">cre</span><span class="ai">ai</span><span class="te">te</span>
  </h1>
  <p class="tagline">where ideas become reality</p>
</div>
```

## 🔧 Complete Implementation Functions

### All-in-One Logo Display Function

```javascript
function displayAllCreaiteVariants() {
  console.clear();
  
  // Header
  console.log(chalk.yellow.bold('\n══════════════════════════════════════════════════════════'));
  console.log(chalk.yellow.bold('                    CREAITE LOGO VARIANTS                  '));
  console.log(chalk.yellow.bold('══════════════════════════════════════════════════════════\n'));

  // Variant 1: Main Banner
  console.log(chalk.cyan.bold('\n▶ Variant 1: Main ASCII Banner (UPPERCASE for banners only)'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  displayMainLogo();

  // Variant 2: Figlet
  console.log(chalk.cyan.bold('\n▶ Variant 2: Stylized Figlet Version (lowercase)'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  displayStylizedLogo();

  // Variant 3: Minimal
  console.log(chalk.cyan.bold('\n▶ Variant 3: Minimal Inline Version (lowercase with AI emphasis)'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  displayMinimalLogo();

  // Text variations
  console.log(chalk.cyan.bold('\n▶ Variant 4: Text Representations'));
  console.log(chalk.gray('────────────────────────────────────────────────────────────'));
  console.log('\n  Regular text:        ', chalk.hex('#0e7490')('cre') + chalk.hex('#f59e0b').bold('ai') + chalk.hex('#0e7490')('te'));
  console.log('  With AI emphasis:    ', chalk.hex('#0e7490').bold('cre') + chalk.hex('#f59e0b').bold('ai') + chalk.hex('#0e7490').bold('te'));
  console.log('  Markdown emphasis:   ', 'cre**ai**te');
  console.log('  Bracket emphasis:    ', 'cre[ai]te');
  console.log('  In a sentence:       ', chalk.gray('Welcome to'), chalk.white('creaite') + chalk.gray(', where ideas come to life'));

  console.log(chalk.yellow.bold('\n══════════════════════════════════════════════════════════\n'));
}
```

### Export Module for Reuse

```javascript
// creaite-branding.js - Save this as a module
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';

// Brand constants
export const CREAITE_COLORS = {
  tealDark: '#115e59',
  tealPrimary: '#0e7490',
  goldDark: '#b45309',
  goldPrimary: '#f59e0b',
  background: '#111827',
  textLight: '#e5e7eb',
  textWhite: '#ffffff',
  gray: '#6b7280'
};

// Gradients
const cyanGradient = gradient([CREAITE_COLORS.tealDark, CREAITE_COLORS.tealPrimary]);
const aiGradient = gradient([CREAITE_COLORS.goldDark, CREAITE_COLORS.goldPrimary]);

// Logo functions
export const displayMainLogo = () => { /* Variant 1 code here */ };
export const displayStylizedLogo = () => { /* Variant 2 code here */ };
export const displayMinimalLogo = () => { /* Variant 3 code here */ };

// Text helpers
export const inlineLogoColored = () => 
  chalk.hex(CREAITE_COLORS.tealPrimary).bold('cre') + 
  chalk.hex(CREAITE_COLORS.goldPrimary).bold('ai') + 
  chalk.hex(CREAITE_COLORS.tealPrimary).bold('te');

export const plainTextLogo = () => 'creaite';
```

## 🎨 Designer Agent Consultation

**IMPORTANT**: For all dashboard and report builds, you must consult the designer agent to ensure:

- **Visual Hierarchy**: Proper placement and sizing of logo elements
- **Brand Consistency**: Correct application of color schemes and typography
- **Layout Optimization**: Best practices for terminal/CLI interfaces
- **User Experience**: Intuitive and accessible design patterns

The designer agent will provide specific guidance on:
- When to use Variant 1 (ASCII Banner) vs Variant 4 (Capitals)
- Optimal spacing and positioning
- Color contrast and accessibility
- Responsive behavior across different terminal sizes

## ✅ Usage Checklist for Agents

Before implementing, verify:

- [ ] Using lowercase `creaite` (except in ASCII banners and report headings)
- [ ] AI portion is gold (#f59e0b) when colors available
- [ ] Primary color is teal (#0e7490)
- [ ] Never split or hyphenate the word
- [ ] Using exact color values provided
- [ ] Consistent with brand guidelines
- [ ] Proper variant for context (banner vs inline vs minimal vs report heading)
- [ ] **Consulted designer agent for dashboard/report layouts**

## 🚫 What NOT to Do

```javascript
// ❌ NEVER DO THESE:
const wrong1 = 'Creaite';           // No capital C
const wrong2 = 'CREAITE';           // No all caps in body text
const wrong3 = 'CreAIte';           // No mixed case
const wrong4 = 'cre-AI-te';         // No hyphens
const wrong5 = 'cre.ai.te';         // No dots
const wrong6 = 'C.R.E.A.I.T.E';    // No acronym style

// ❌ Wrong colors
const wrongColor1 = '#00ff00';      // Not brand green
const wrongColor2 = '#ff0000';      // Not brand red
const wrongColor3 = '#blue';        // Not brand blue
```

## 📞 Questions?

If you need clarification on any implementation:
1. Refer to the brand guidelines in `creaite-logo-rules.md`
2. Check examples in `logo-variants.md`
3. Test with `display-logo.js` and `simple-logo.js`
4. Always maintain brand consistency

Remember: **creaite** - where ideas become reality! ✨
