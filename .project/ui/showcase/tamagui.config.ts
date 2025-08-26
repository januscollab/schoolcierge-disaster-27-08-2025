import { createTamagui } from 'tamagui'
import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/themes'

// Import design tokens from handover
const designTokens = {
  color: {
    primary: {
      deepPurple: '#3D348B',
      periwinkle: '#7678ED',
      gold: '#F7B801',
      orange: '#F18701',
      redOrange: '#F35B04'
    },
    neutral: {
      black: '#1A1A1A',
      darkGray: '#4A4A4A',
      gray: '#757575',
      lightGray: '#D1D1D1',
      offWhite: '#F7F7F7',
      white: '#FFFFFF'
    },
    semantic: {
      success: '#4CAF50',
      error: '#F35B04',
      warning: '#F18701',
      info: '#7678ED'
    }
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  size: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  radius: {
    small: 4,
    medium: 8,
    large: 12,
    full: 9999
  },
  zIndex: {
    base: 0,
    floating: 100,
    modal: 200,
    overlay: 300
  }
}

// Create Inter font config
const headingFont = createInterFont({
  size: {
    display: 36,
    h1: 32,
    h2: 24,
    h3: 20,
    bodyLarge: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    micro: 10
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    display: 44,
    h1: 40,
    h2: 32,
    h3: 28,
    bodyLarge: 26,
    body: 24,
    bodySmall: 20,
    caption: 16,
    micro: 14
  }
})

// Create animation config
const animations = {
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250
  },
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)'
  }
}

// Create theme config
const appTheme = {
  background: designTokens.color.neutral.white,
  backgroundHover: designTokens.color.neutral.offWhite,
  backgroundPress: designTokens.color.neutral.lightGray,
  backgroundFocus: designTokens.color.neutral.offWhite,
  color: designTokens.color.neutral.black,
  colorHover: designTokens.color.neutral.darkGray,
  borderColor: designTokens.color.neutral.lightGray,
  borderColorHover: designTokens.color.neutral.gray,
  shadowColor: designTokens.color.neutral.black,
  shadowColorHover: designTokens.color.neutral.darkGray
}

// Create Tamagui config
const config = createTamagui({
  fonts: {
    heading: headingFont,
    body: headingFont
  },
  tokens: {
    ...tokens,
    color: designTokens.color,
    space: designTokens.space,
    size: designTokens.size,
    radius: designTokens.radius,
    zIndex: designTokens.zIndex
  },
  themes: {
    ...themes,
    light: appTheme,
    dark: {
      ...appTheme,
      background: designTokens.color.neutral.black,
      backgroundHover: designTokens.color.neutral.darkGray,
      backgroundPress: designTokens.color.neutral.gray,
      backgroundFocus: designTokens.color.neutral.darkGray,
      color: designTokens.color.neutral.white,
      colorHover: designTokens.color.neutral.offWhite,
      borderColor: designTokens.color.neutral.gray,
      borderColorHover: designTokens.color.neutral.lightGray
    }
  },
  shorthands,
  defaultFont: 'body',
  animations
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config