import { GetProps, Stack, styled } from 'tamagui'

// Create base card component
export const Card = styled(Stack, {
  name: 'Card',

  // Default styles
  backgroundColor: '$neutral.white',
  borderRadius: 12,
  padding: 16,
  
  // Variants
  variants: {
    variant: {
      default: {
        borderWidth: 1,
        borderColor: '$neutral.lightGray',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
      priority: {
        borderLeftWidth: 4,
        backgroundColor: '$neutral.offWhite',
      },
      interactive: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
      },
    },
    priority: {
      critical: {
        borderLeftColor: '$semantic.error',
        backgroundColor: 'rgba(243, 91, 4, 0.05)',
      },
      urgent: {
        borderLeftColor: '$semantic.warning',
        backgroundColor: 'rgba(241, 135, 1, 0.05)',
      },
      achievement: {
        borderLeftColor: '$primary.gold',
        backgroundColor: 'rgba(247, 184, 1, 0.05)',
      },
      academic: {
        borderLeftColor: '$primary.periwinkle',
        backgroundColor: 'rgba(118, 120, 237, 0.05)',
      },
      info: {
        borderLeftColor: '$primary.deepPurple',
        backgroundColor: 'rgba(61, 52, 139, 0.05)',
      },
    },
    elevation: {
      none: {
        shadowOpacity: 0,
        elevation: 0,
      },
      small: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 1,
      },
      medium: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
      large: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
      },
    },
  },

  // Default variant
  defaultVariants: {
    variant: 'default',
    elevation: 'medium',
  },
})

// Export types
export type CardProps = GetProps<typeof Card>

// Export variations for storybook
export const CardVariants = {
  Default: (props: CardProps) => <Card variant="default" {...props} />,
  Priority: (props: CardProps) => <Card variant="priority" {...props} />,
  Interactive: (props: CardProps) => <Card variant="interactive" {...props} />,
}