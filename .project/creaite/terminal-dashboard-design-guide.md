# Terminal Dashboard & Reporting Design Guide for CLI Agents

This guide provides standards for designing consistent, readable, and professional command outputs and reports in terminal applications. Based on best practices from leading CLI frameworks (Rich, Cobra, oclif, Blessed), this will ensure agents produce standardized, user-friendly terminal interfaces.

## 🎯 Core Principles

### 1. **Consistency Above All**
- Use consistent spacing, alignment, and visual patterns
- Establish a visual hierarchy and stick to it
- Standardize colors, symbols, and formatting across all outputs

### 2. **Readability First**
- Prioritize clarity over cleverness
- Use whitespace effectively to create visual breathing room
- Ensure high contrast between text and backgrounds

### 3. **Progressive Information Disclosure**
- Show most important information first
- Use summaries before details
- Allow users to drill down when needed

### 4. **Responsive Design**
- Adapt layouts to different terminal widths
- Handle text wrapping gracefully
- Provide fallbacks for limited color support

## 📐 Layout Standards

### Terminal Width Assumptions
```
Minimum supported width: 80 columns
Optimal width: 120 columns
Maximum useful width: 160 columns
```

### Standard Margins and Padding
```
Outer margin: 2 spaces from terminal edge
Section padding: 1 empty line between sections
Column gutter: 4 spaces between columns
Indent levels: 2 spaces per level
```

### Content Zones
```
┌─ Header Zone (Logo, Title, Status) ─────────────────────┐
│                                                         │
├─ Navigation Zone (Breadcrumbs, Tabs) ──────────────────┤
│                                                         │
├─ Content Zone (Main data, reports) ────────────────────┤
│  ┌─ Summary Panel ─────┐ ┌─ Detail Panel ───────────┐  │
│  │                     │ │                         │  │
│  └─────────────────────┘ └─────────────────────────┘  │
├─ Action Zone (Buttons, Commands) ──────────────────────┤
│                                                         │
└─ Status Zone (Progress, Messages) ─────────────────────┘
```

## 🎨 Visual Elements

### Color Palette Standards
```yaml
# Primary Colors (from Rich/Blessed best practices)
success: '#00ff00'    # bright green
warning: '#ffaa00'    # orange  
error: '#ff0000'      # bright red
info: '#0088ff'       # bright blue
muted: '#888888'      # gray

# Background Colors
primary_bg: '#000000' # black
secondary_bg: '#222222' # dark gray
accent_bg: '#444444'  # medium gray

# Status Colors  
active: '#00ffff'     # cyan
inactive: '#666666'   # dark gray
highlight: '#ffff00'  # yellow
```

### Typography Hierarchy
```
┌─ Headers ─────────────────────────────────────────────┐
│ H1: BOLD UPPERCASE + Borders                         │
│ H2: Bold Title Case                                   │  
│ H3: Regular Bold                                      │
└───────────────────────────────────────────────────────┘

┌─ Report Headings (Brand Standard) ───────────────────┐
│ CREAITE - Use Variant 4 in CAPITALS for all reports │
│ Always consult designer agent for layout decisions   │
└───────────────────────────────────────────────────────┘

┌─ Body Text ───────────────────────────────────────────┐
│ Primary: Regular weight, high contrast               │
│ Secondary: Regular weight, medium contrast           │ 
│ Muted: Regular weight, low contrast                  │
└───────────────────────────────────────────────────────┘

┌─ Special Text ────────────────────────────────────────┐
│ Code/Data: Monospace font                            │
│ Emphasis: Italic or colored                          │
│ Critical: Bold + Color                               │
└───────────────────────────────────────────────────────┘
```

### Border and Separator Styles
```
Heavy Borders (Major sections):
╔═══════════════════════════════════════════════════════╗
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Light Borders (Subsections):
┌───────────────────────────────────────────────────────┐
│                                                       │
└───────────────────────────────────────────────────────┘

Rules and Dividers:
─────────────────────────────────────────────────────────
═════════════════════════════════════════════════════════
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
```

## 🧩 Standard Components

### 1. **Dashboard Header Template**
```
╔══════════════════════════════════════════════════════════════╗
║  🚀 CREAITE DASHBOARD                              STATUS: ✅ ║
╠══════════════════════════════════════════════════════════════╣
║  Project: my-awesome-project      Last Updated: 2 min ago    ║
╚══════════════════════════════════════════════════════════════╝
```

**Note:** For report headings, use `CREAITE` (Variant 4 in capitals). Always consult the designer agent for optimal dashboard and report layouts to ensure brand consistency and visual hierarchy.

### 2. **Status Indicator Patterns**
```yaml
# Success States
✅ Complete    ✓ Done       🟢 Active      ▶ Running
✨ Perfect     ⭐ Excellent  💚 Healthy     🚀 Ready

# Warning States  
⚠️  Warning    ⏳ Pending   🟡 Caution    ⏸ Paused
🔄 Processing  📝 Review    🟠 Attention  ⏱ Timeout

# Error States
❌ Failed      ✗ Error     🔴 Critical   🛑 Stopped  
💥 Crashed     ⛔ Blocked   🚫 Denied     💔 Broken

# Info States
ℹ️  Info       📊 Data     🔵 Normal     📢 Notice
🔍 Details     📋 Report   💼 Business   🎯 Target
```

### 3. **Progress Indicators**
```
# Bar Progress (for known quantities)
Progress: ████████████████████████████████████████ 100% (50/50)
Loading:  ████████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  67% (2/3)

# Spinner Progress (for unknown durations)  
⠋ Processing...   ⠙ Analyzing...   ⠹ Optimizing...   ⠸ Finalizing...

# Step Progress (for sequential tasks)
[1/4] ✅ Initialize   [2/4] ✅ Process   [3/4] 🔄 Deploy   [4/4] ⏳ Verify
```

### 4. **Data Table Format**
```
┌─────────────────────┬─────────────┬────────────┬──────────────┐
│ Name                │ Status      │ Progress   │ Last Updated │
├─────────────────────┼─────────────┼────────────┼──────────────┤
│ Authentication      │ ✅ Complete │ 100%       │ 2 min ago    │
│ Database Migration  │ 🔄 Running  │ 67%        │ Just now     │
│ Asset Compilation   │ ⏳ Queued   │ 0%         │ 5 min ago    │
│ Testing Suite       │ ❌ Failed   │ 45%        │ 10 min ago   │
└─────────────────────┴─────────────┴────────────┴──────────────┘
```

### 5. **Summary Card Layout**
```
┌─ SYSTEM OVERVIEW ──────────────────────────────────────────┐
│                                                            │
│  Total Projects: 12        Active: 8         Failed: 1    │
│  Success Rate: 91.7%       Avg Duration: 2.3 min          │
│                                                            │  
│  🟢 Healthy Services: 15   🟡 Warning Services: 3         │
│  🔴 Critical Issues: 1     ⚡ Performance: Good            │
│                                                            │
│  Next Action: Review failed deployment →                  │
└────────────────────────────────────────────────────────────┘
```

### 6. **Command Help Format**
```
USAGE
  command [OPTIONS] [ARGUMENTS]

ARGUMENTS  
  <input>     Input file or directory (required)
  [output]    Output destination (optional)

OPTIONS
  -v, --verbose          Show detailed output
  -f, --format <type>    Output format (json|yaml|table)
  -h, --help             Display this help message
      --dry-run          Preview changes without executing

EXAMPLES
  command input.txt                    # Basic usage
  command -f json input.txt output/   # With format option
  command --verbose --dry-run data/   # Preview with details
```

## 🔧 Implementation Templates

### Base Report Function Template

```javascript
function generateStandardReport(data, options = {}) {
  const { 
    title = 'REPORT',
    width = 80,
    showHeader = true,
    showFooter = true,
    colorized = true 
  } = options;

  let output = '';
  
  // Header section
  if (showHeader) {
    output += renderHeader(title, width, colorized);
    output += '\n';
  }
  
  // Summary section (if data has summary)
  if (data.summary) {
    output += renderSummaryCards(data.summary, width, colorized);
    output += '\n';
  }
  
  // Main content section
  if (data.details) {
    output += renderDataTable(data.details, width, colorized);
    output += '\n';
  }
  
  // Action items section (if any)
  if (data.actions && data.actions.length > 0) {
    output += renderActionItems(data.actions, width, colorized);
    output += '\n';
  }
  
  // Footer section
  if (showFooter) {
    output += renderFooter(new Date().toISOString(), width, colorized);
  }
  
  return output;
}

function renderHeader(title, width, colorized) {
  const border = '═'.repeat(width - 4);
  const padding = ' '.repeat(Math.max(0, (width - title.length - 4) / 2));
  
  let header = `╔══${border}══╗\n`;
  header += `║  ${padding}${title}${padding}  ║\n`;
  header += `╚══${border}══╝`;
  
  return colorized ? `\x1b[1m${header}\x1b[0m` : header;
}
```

### Status Display Template

```javascript
function renderStatusGrid(items, columns = 4) {
  const statusIcons = {
    'success': '✅',
    'warning': '⚠️',
    'error': '❌', 
    'info': 'ℹ️',
    'active': '🟢',
    'inactive': '🔴'
  };
  
  let output = '';
  
  for (let i = 0; i < items.length; i += columns) {
    const row = items.slice(i, i + columns);
    const statusLine = row.map(item => 
      `${statusIcons[item.status] || '●'} ${item.name}`
    ).join('    ');
    
    output += `  ${statusLine}\n`;
  }
  
  return output;
}
```

### Progress Bar Template  

```javascript
function renderProgressBar(current, total, width = 40, label = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '▒'.repeat(empty);
  const stats = `${percentage}% (${current}/${total})`;
  
  return `${label}${label ? ': ' : ''}${bar} ${stats}`;
}
```

## 📋 Content Guidelines

### Text Content Rules

1. **Use Action-Oriented Language**
   - "Building..." instead of "Build process initiated"
   - "3 errors found" instead of "Error detection process completed with 3 results"

2. **Be Specific and Quantified**
   - "Processed 1,234 records in 2.3 seconds"
   - "Memory usage: 45.2MB (12% of available)"

3. **Show Relationships**
   - Use indentation to show hierarchy
   - Group related items visually
   - Show dependencies clearly

### Error Message Standards

```
┌─ ERROR DETAILS ────────────────────────────────────────────┐
│                                                            │
│  ❌ Build Failed: Missing Dependencies                     │
│                                                            │
│  Problem:                                                  │
│    Unable to resolve module '@types/node'                 │
│                                                            │
│  Location:                                                 │
│    File: src/components/Header.tsx:1:23                   │
│                                                            │
│  Solution:                                                 │
│    Run: npm install @types/node --save-dev               │
│                                                            │
│  Context:                                                  │
│    This happened during the TypeScript compilation phase  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Success Message Standards

```
🎉 SUCCESS: Deployment Complete

✅ All services started successfully
📊 Performance metrics:
   • Build time: 2.3 minutes  
   • Bundle size: 1.2MB (-15% from last build)
   • Tests passed: 247/247

🚀 Your app is live at: https://my-app.vercel.app

Next Steps:
  • Monitor performance dashboard →
  • Update team in #deployments channel
```

## 🎮 Interactive Elements

### Menu/Navigation Templates

```
┌─ MAIN MENU ────────────────────────────────────────────────┐
│                                                            │
│  [1] 📊 View Dashboard        [2] 🚀 Deploy Application    │
│  [3] 📝 View Logs            [4] ⚙️  Configure Settings   │
│  [5] 📋 Generate Reports     [6] 🔍 Debug Tools           │
│                                                            │
│  [h] Help                    [q] Quit                     │
└────────────────────────────────────────────────────────────┘

Select option (1-6, h, q): _
```

### Form Input Templates

```
┌─ PROJECT CONFIGURATION ────────────────────────────────────┐
│                                                            │
│  Project Name: [my-awesome-app________________]            │
│  Environment:  [●] Development  [ ] Staging  [ ] Production│
│  Database:     [PostgreSQL ▼] (click to select)          │
│  Auto-deploy:  [✓] Enable automatic deployments          │
│                                                            │
│  [ Save Configuration ]  [ Cancel ]  [ Reset to Defaults ]│
└────────────────────────────────────────────────────────────┘
```

## 🔄 Animation and Loading States

### Loading Patterns

```javascript
const loadingStates = [
  '⠋ Initializing...',
  '⠙ Connecting to services...',  
  '⠹ Loading configuration...',
  '⠸ Processing data...',
  '⠼ Finalizing setup...',
  '✅ Complete!'
];

// Spinner frames for unknown duration tasks
const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['|', '/', '-', '\\'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙']
};
```

### Progress Feedback
```
┌─ DEPLOYMENT PROGRESS ──────────────────────────────────────┐
│                                                            │
│  [1/5] ✅ Code Analysis      Complete (2.1s)              │
│  [2/5] ✅ Build Assets       Complete (15.3s)             │  
│  [3/5] 🔄 Deploy to Server   ████████▒▒▒▒ 67% (45.2s)     │
│  [4/5] ⏳ Run Tests          Queued                        │
│  [5/5] ⏳ Final Verification Queued                        │
│                                                            │
│  Overall Progress: ████████████▒▒▒▒▒▒▒▒ 60%               │
│  Estimated remaining: 2 min 15 sec                        │
└────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Width Adaptation Rules

```javascript
function adaptToWidth(content, terminalWidth) {
  if (terminalWidth < 80) {
    // Mobile-like: Stack vertically, reduce margins
    return renderMobileLayout(content);
  } else if (terminalWidth < 120) {
    // Standard: Normal layout
    return renderStandardLayout(content);
  } else {
    // Wide: Side-by-side panels, more details
    return renderWideLayout(content);
  }
}
```

### Fallback Strategies

```yaml
# Color Fallbacks
- If 256-color not supported: Use 16 basic colors
- If color not supported: Use symbols (✓/✗) and formatting
- If Unicode not supported: Use ASCII equivalents (*/+/-)

# Layout Fallbacks  
- If width < 80: Single column, simplified borders
- If height < 24: Reduce spacing, paginate long content
- If no cursor control: Use simple line-by-line output
```

## ✅ Quality Checklist

Before deploying any terminal interface, verify:

### Visual Quality
- [ ] Consistent alignment across all sections
- [ ] Proper spacing between elements  
- [ ] No jagged edges or misaligned borders
- [ ] Color contrast is sufficient for readability
- [ ] Text doesn't overflow designated areas

### Functional Quality
- [ ] All interactive elements are clearly marked
- [ ] Loading states provide appropriate feedback
- [ ] Error messages are actionable and clear
- [ ] Success states confirm completion
- [ ] Navigation is intuitive and consistent

### Performance Quality
- [ ] Fast rendering (< 100ms for typical outputs)
- [ ] Efficient screen updates (only redraw changed areas)
- [ ] Graceful handling of large datasets
- [ ] Memory usage remains reasonable
- [ ] No flickering or visual artifacts

### Accessibility Quality  
- [ ] High contrast modes supported
- [ ] Screen reader compatible (when possible)
- [ ] Keyboard navigation fully functional
- [ ] No reliance solely on color for meaning
- [ ] Alternative text representations available

## 🚀 Implementation Examples

### Example 1: System Status Dashboard

```javascript
function renderSystemDashboard(systemData) {
  const output = [];
  
  // Header
  output.push(renderBanner('SYSTEM STATUS DASHBOARD', '🖥️'));
  output.push('');
  
  // Quick Stats
  const stats = [
    { label: 'CPU Usage', value: `${systemData.cpu}%`, status: systemData.cpu > 80 ? 'warning' : 'success' },
    { label: 'Memory', value: `${systemData.memory}%`, status: systemData.memory > 90 ? 'error' : 'success' },
    { label: 'Disk Space', value: `${systemData.disk}%`, status: systemData.disk > 85 ? 'warning' : 'success' },
    { label: 'Network', value: 'Connected', status: 'success' }
  ];
  
  output.push(renderStatsGrid(stats, 4));
  output.push('');
  
  // Services Table
  output.push('Active Services:');
  output.push(renderServicesTable(systemData.services));
  output.push('');
  
  // Recent Activity
  output.push('Recent Activity:');
  output.push(renderActivityLog(systemData.recentActivity, 5));
  
  return output.join('\n');
}
```

### Example 2: Build Report  

```javascript
function renderBuildReport(buildData) {
  const report = [];
  
  // Build Summary
  report.push(renderBuildSummary(buildData.summary));
  report.push('');
  
  // Step Details
  if (buildData.steps) {
    report.push('Build Steps:');
    buildData.steps.forEach((step, index) => {
      report.push(renderBuildStep(step, index + 1, buildData.steps.length));
    });
    report.push('');
  }
  
  // Warnings/Errors
  if (buildData.issues && buildData.issues.length > 0) {
    report.push('Issues Found:');
    report.push(renderIssuesList(buildData.issues));
    report.push('');
  }
  
  // Performance Metrics
  if (buildData.metrics) {
    report.push('Performance Metrics:');
    report.push(renderMetricsTable(buildData.metrics));
  }
  
  return report.join('\n');
}
```

Remember: **Consistency, clarity, and user-centricity** should guide every design decision. The terminal interface should feel like a natural extension of the user's workflow, not an obstacle to it.

---

*This guide is based on best practices from Rich (Python), Cobra (Go), oclif (Node.js), and Blessed (Node.js) - industry-leading CLI/TUI frameworks.*
