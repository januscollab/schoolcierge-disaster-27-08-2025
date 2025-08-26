# Schoolcierge Design System Documentation
**Version 1.0 | Created: 2025**

## Table of Contents
1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Iconography](#iconography)
7. [Motion & Animation](#motion--animation)
8. [Accessibility](#accessibility)
9. [Platform Considerations](#platform-considerations)

---

## Design Principles

### Core Philosophy
**"Information at a Glance, Action in a Tap"**

Our design system prioritizes:
1. **Speed of Information Access** - Parents should understand their child's status in under 3 seconds
2. **Priority-Based Hierarchy** - Critical information surfaces first, always
3. **Family-Centric Organization** - Multi-child families navigate effortlessly
4. **Trust Through Transparency** - Clear, honest communication patterns
5. **Respectful of Time** - Every interaction respects busy parent schedules

### Design Values
- **Clarity over Cleverness** - Simple, obvious interactions
- **Consistency over Novelty** - Familiar patterns across all touchpoints
- **Function over Form** - Beauty serves purpose, not vice versa
- **Inclusive by Default** - Accessible to all abilities and contexts

---

## Color System

### Primary Palette

| Color Name | Hex Code | RGB | Usage | Accessibility |
|------------|----------|-----|-------|--------------|
| **Deep Purple** | `#3D348B` | 61, 52, 139 | Primary brand, headers, CTAs | WCAG AAA on white |
| **Periwinkle** | `#7678ED` | 118, 120, 237 | Secondary actions, links, accents | WCAG AA on white |
| **Gold** | `#F7B801` | 247, 184, 1 | Success, achievements, celebrations | WCAG AAA on dark |
| **Orange** | `#F18701` | 241, 135, 1 | Warnings, urgent actions | WCAG AA on white |
| **Red-Orange** | `#F35B04` | 243, 91, 4 | Critical alerts, emergencies | WCAG AA on white |

### Neutral Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Black** | `#1A1A1A` | Primary text |
| **Dark Gray** | `#4A4A4A` | Secondary text |
| **Gray** | `#757575` | Tertiary text, disabled states |
| **Light Gray** | `#D1D1D1` | Borders, dividers |
| **Off White** | `#F7F7F7` | Backgrounds |
| **White** | `#FFFFFF` | Cards, primary backgrounds |

### Semantic Colors

```javascript
const semanticColors = {
  // Status Colors
  success: '#4CAF50',     // Green - Positive outcomes
  error: '#F35B04',       // Red-Orange - Errors, critical
  warning: '#F18701',     // Orange - Caution needed
  info: '#7678ED',        // Periwinkle - Informational
  
  // Priority Levels
  critical: '#F35B04',    // Immediate action required
  urgent: '#F18701',      // Action needed soon
  achievement: '#F7B801', // Positive recognition
  academic: '#7678ED',    // School-related
  general: '#3D348B',     // Standard priority
  
  // Functional Colors
  interactive: '#7678ED', // Clickable elements
  disabled: '#D1D1D1',    // Inactive states
  overlay: 'rgba(0,0,0,0.5)', // Modal backgrounds
  shadow: 'rgba(0,0,0,0.1)',  // Elevation shadows
}
```

### Color Usage Guidelines

#### Priority Messaging
- **Critical (Red-Orange)**: Emergency, safety, immediate parent action
- **Urgent (Orange)**: Time-sensitive, due today/tomorrow
- **Achievement (Gold)**: Celebrations, positive feedback
- **Academic (Periwinkle)**: Grades, assignments, learning
- **General (Deep Purple)**: Standard communications

#### State Colors
- **Default**: Base color
- **Hover/Press**: 10% darker
- **Active**: 20% darker
- **Disabled**: 40% opacity
- **Focus**: 3px outline with primary color

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Type Scale

| Level | Size (px) | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| **Display** | 36 | 44 | Bold | App titles, splash screens |
| **H1** | 32 | 40 | Bold | Screen titles |
| **H2** | 24 | 32 | Semibold | Section headers |
| **H3** | 20 | 28 | Semibold | Card titles |
| **Body Large** | 18 | 26 | Regular | Important body text |
| **Body** | 16 | 24 | Regular | Standard content |
| **Body Small** | 14 | 20 | Regular | Secondary content |
| **Caption** | 12 | 16 | Regular | Timestamps, labels |
| **Micro** | 10 | 14 | Medium | Badges, tags |

### Typography Guidelines

#### Hierarchy Rules
1. Maximum 3 type sizes per screen
2. Minimum 2pt size difference between levels
3. Bold for emphasis, never for long text
4. Italic reserved for quotes and citations only

#### Text Color Application
- **Headers (H1-H3)**: Deep Purple (#3D348B)
- **Body Text**: Black (#1A1A1A)
- **Secondary Text**: Dark Gray (#4A4A4A)
- **Disabled/Hint Text**: Gray (#757575)
- **Links**: Periwinkle (#7678ED)
- **Error Text**: Red-Orange (#F35B04)

---

## Spacing & Layout

### Spacing Scale (Base 4px)
```javascript
const spacing = {
  xs: 4,   // Tight spacing
  sm: 8,   // Compact elements
  md: 16,  // Standard spacing
  lg: 24,  // Section spacing
  xl: 32,  // Major sections
  xxl: 48, // Screen padding
}
```

### Grid System
- **Mobile**: 4 columns, 16px margins, 8px gutters
- **Tablet**: 8 columns, 24px margins, 16px gutters
- **Desktop**: 12 columns, 32px margins, 24px gutters

### Layout Patterns

#### Card Layouts
```
Padding: 16px (md)
Border Radius: 12px
Shadow: 0 2px 8px rgba(0,0,0,0.1)
Margin between cards: 12px
```

#### Screen Margins
- **Mobile**: 16px horizontal, 24px vertical
- **Tablet**: 24px horizontal, 32px vertical
- **Safe Area**: Additional system insets

#### Component Spacing
- **Button height**: 48px (touch target)
- **Input height**: 44px minimum
- **Icon touch target**: 44x44px minimum
- **List item height**: 56px minimum

---

## Component Library

### Buttons

#### Primary Button
```
Background: Deep Purple (#3D348B)
Text: White (#FFFFFF)
Height: 48px
Border Radius: 12px
Font: 16px Semibold
Padding: 12px 24px
Press State: Scale 0.95
Disabled: 40% opacity
```

#### Secondary Button
```
Background: White (#FFFFFF)
Border: 2px solid Periwinkle (#7678ED)
Text: Periwinkle (#7678ED)
Height: 48px
Border Radius: 12px
```

#### Text Button
```
Background: Transparent
Text: Periwinkle (#7678ED)
Height: 40px
Underline on press
```

### Cards

#### Standard Card
```
Background: White (#FFFFFF)
Border Radius: 12px
Padding: 16px
Shadow: 0 2px 8px rgba(0,0,0,0.1)
Border: 1px solid Light Gray (#D1D1D1)
```

#### Priority Card
```
Same as Standard +
Left Border: 4px solid [priority color]
Background tint: 5% of priority color
```

### Input Fields

#### Text Input
```
Height: 44px
Background: Off White (#F7F7F7)
Border: 1px solid Light Gray (#D1D1D1)
Border Radius: 8px
Padding: 12px
Focus Border: Deep Purple (#3D348B)
Font Size: 16px
```

#### Validation States
- **Error**: Red-Orange border + error text below
- **Success**: Green border + checkmark icon
- **Warning**: Orange border + warning text

### Navigation

#### Tab Bar
```
Height: 56px
Background: White (#FFFFFF)
Active Color: Deep Purple (#3D348B)
Inactive Color: Gray (#757575)
Indicator: 3px bottom border
```

#### Header
```
Height: 56px + safe area
Background: Deep Purple (#3D348B)
Title: White, 20px Semibold
Back Button: White icon, 44x44 touch target
```

### Badges & Pills

#### Notification Badge
```
Size: 20px diameter
Background: Red-Orange (#F35B04)
Text: White, 10px Bold
Position: Top-right, -2px offset
```

#### Status Pills
```
Height: 24px
Padding: 4px 8px
Border Radius: 12px
Font: 12px Medium
Background: 10% tint of status color
Text: Status color
```

---

## Iconography

### Icon Library
- **Primary**: Lucide Icons (open source, consistent)
- **Size Scale**: 16px, 20px, 24px, 32px
- **Stroke Width**: 2px (standard), 1.5px (small sizes)

### Icon Usage Matrix

| Category | Icons | Color | Usage |
|----------|-------|-------|-------|
| **Navigation** | Home, Back, Menu, Search | UI colors | Navigation only |
| **Communication** | MessageCircle, Bell, Mail, Phone | Periwinkle | Messaging features |
| **Academic** | BookOpen, GraduationCap, Award, Trophy | Gold/Purple | Academic content |
| **Schedule** | Calendar, Clock, Timer, AlertCircle | Orange | Time-sensitive |
| **Student** | User, Users, UserPlus, UserCheck | Deep Purple | Profile/identity |
| **Transport** | Bus, Car, MapPin, Navigation | Orange | Location/transit |
| **Financial** | DollarSign, CreditCard, Receipt | Green | Payments |
| **Settings** | Settings, Sliders, Toggle, Lock | Gray | Configuration |

### Icon Guidelines
1. Always pair icons with text on first use
2. Maintain 44x44px touch targets
3. Use filled versions for active states
4. Apply 20% opacity for disabled states
5. Ensure 3:1 contrast ratio minimum

---

## Motion & Animation

### Animation Principles
- **Purposeful**: Every animation has a clear function
- **Quick**: 200-300ms for most transitions
- **Smooth**: Use easing functions, never linear
- **Subtle**: Enhance, don't distract

### Standard Animations

#### Screen Transitions
```javascript
const transitions = {
  push: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    style: 'slide-from-right'
  },
  modal: {
    duration: 250,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    style: 'slide-from-bottom'
  },
  fade: {
    duration: 200,
    easing: 'ease-in-out'
  }
}
```

#### Micro-interactions
- **Button Press**: Scale to 0.95, duration 100ms
- **Card Press**: Scale to 0.98, duration 150ms
- **Switch Toggle**: Slide + fade, duration 200ms
- **Loading Spinner**: Continuous rotation, 1s cycle
- **Progress Bar**: Smooth fill, 300ms segments

#### Feedback Animations
- **Success**: Check mark draw, 400ms
- **Error**: Shake horizontal, 300ms
- **Delete**: Slide + fade out, 250ms
- **Refresh**: Pull + bounce, 400ms

### Performance Guidelines
- Prefer transform and opacity animations
- Use will-change sparingly
- Disable animations in reduced motion mode
- Test on low-end devices (minimum 30fps)

---

## Accessibility

### WCAG 2.1 Compliance
- **Level AA minimum** for all features
- **Level AAA** for critical emergency features

### Color Accessibility
- **Contrast Ratios**:
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
  - Interactive elements: 3:1 minimum
- **Color Independence**: Never rely solely on color
- **Focus Indicators**: Visible keyboard focus states

### Touch Accessibility
- **Touch Targets**: 44x44px minimum
- **Spacing**: 8px minimum between targets
- **Gesture Alternatives**: Always provide tap alternatives
- **Drag Handles**: 44px minimum for draggable elements

### Content Accessibility
- **Text Scaling**: Support 100-200% scaling
- **Reading Level**: 8th grade maximum
- **Alt Text**: All images and icons
- **Labels**: All form inputs
- **Errors**: Clear, actionable error messages

### Screen Reader Support
```javascript
const a11yLabels = {
  // Navigation
  backButton: "Go back",
  menuButton: "Open menu",
  closeButton: "Close",
  
  // Status
  unreadBadge: "New messages",
  priorityHigh: "High priority",
  requiredField: "Required",
  
  // Actions
  deleteButton: "Delete item",
  editButton: "Edit item",
  shareButton: "Share"
}
```

---

## Platform Considerations

### iOS Specific
- **Safe Areas**: Respect notch and home indicator
- **Haptic Feedback**: Use for important actions
- **SF Symbols**: Fallback for system icons
- **Pull to Refresh**: Standard iOS pattern
- **Swipe Actions**: Right-to-left for delete

### Android Specific
- **Material Ripple**: On all touchable elements
- **Back Button**: Hardware/gesture navigation
- **FAB**: Consider for primary actions
- **Snackbar**: For temporary messages
- **Bottom Sheets**: For action menus

### Web Responsive
- **Breakpoints**:
  - Mobile: 0-768px
  - Tablet: 769-1024px
  - Desktop: 1025px+
- **Hover States**: Desktop only
- **Keyboard Navigation**: Full support
- **Print Styles**: High contrast, no backgrounds

---

## Implementation Tokens

### Design Tokens (JSON)
```json
{
  "color": {
    "primary": {
      "deep-purple": "#3D348B",
      "periwinkle": "#7678ED",
      "gold": "#F7B801",
      "orange": "#F18701",
      "red-orange": "#F35B04"
    },
    "neutral": {
      "black": "#1A1A1A",
      "dark-gray": "#4A4A4A",
      "gray": "#757575",
      "light-gray": "#D1D1D1",
      "off-white": "#F7F7F7",
      "white": "#FFFFFF"
    },
    "semantic": {
      "success": "#4CAF50",
      "error": "#F35B04",
      "warning": "#F18701",
      "info": "#7678ED"
    }
  },
  "typography": {
    "font-family": "'Inter', -apple-system, sans-serif",
    "size": {
      "display": 36,
      "h1": 32,
      "h2": 24,
      "h3": 20,
      "body-large": 18,
      "body": 16,
      "body-small": 14,
      "caption": 12,
      "micro": 10
    },
    "weight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "xxl": 48
  },
  "borderRadius": {
    "small": 4,
    "medium": 8,
    "large": 12,
    "full": 9999
  },
  "shadow": {
    "small": "0 1px 3px rgba(0,0,0,0.12)",
    "medium": "0 2px 8px rgba(0,0,0,0.1)",
    "large": "0 4px 16px rgba(0,0,0,0.15)"
  },
  "animation": {
    "duration": {
      "instant": 100,
      "fast": 200,
      "normal": 300,
      "slow": 400
    },
    "easing": {
      "standard": "cubic-bezier(0.4, 0, 0.2, 1)",
      "accelerate": "cubic-bezier(0.4, 0, 1, 1)",
      "decelerate": "cubic-bezier(0, 0, 0.2, 1)"
    }
  }
}
```

---

## Version History
- **v1.0** (2025-01-17): Initial design system documentation
- Foundation established from UI playground testing
- Validated with parent user research
- Accessibility audit completed

## Contact
For design system questions or suggestions:
- Design System Lead: [Contact]
- Engineering Lead: [Contact]
- Accessibility: [Contact]