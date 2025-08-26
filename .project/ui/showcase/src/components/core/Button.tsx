import { GetProps, styled } from 'tamagui'
import { Button as TamaguiButton } from 'tamagui'

// Create base button component with Tamagui
export const Button = styled(TamaguiButton, {
  name: 'Button',
  
  // Default styles
  height: 44,
  borderRadius: 12,
  paddingHorizontal: 24,
  
  // Typography
  fontFamily: '$body',
  fontSize: 16,
  fontWeight: '600',
  
  // Variants
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary.deepPurple',
        color: '$neutral.white',
        pressStyle: {
          scale: 0.95,
          opacity: 0.9,
          backgroundColor: '$primary.periwinkle',
        },
      },
      secondary: {
        backgroundColor: '$neutral.white',
        borderWidth: 2,
        borderColor: '$primary.periwinkle',
        color: '$primary.periwinkle',
        pressStyle: {
          scale: 0.95,
          opacity: 0.9,
          backgroundColor: '$neutral.offWhite',
        },
      },
      text: {
        backgroundColor: 'transparent',
        color: '$primary.periwinkle',
        height: 40,
        pressStyle: {
          scale: 0.98,
          opacity: 0.8,
        },
      },
      danger: {
        backgroundColor: '$semantic.error',
        color: '$neutral.white',
        pressStyle: {
          scale: 0.95,
          opacity: 0.9,
        },
      },
    },
    size: {
      small: {
        height: 36,
        paddingHorizontal: 16,
        fontSize: 14,
      },
      medium: {
        height: 44,
        paddingHorizontal: 24,
        fontSize: 16,
      },
      large: {
        height: 52,
        paddingHorizontal: 32,
        fontSize: 18,
      },
    },
  },
  
  // Default variant
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
})

// Export types
export type ButtonProps = GetProps<typeof Button>

// Export variations for storybook
export const ButtonVariants = {
  Primary: (props: ButtonProps) => <Button variant="primary" {...props} />,
  Secondary: (props: ButtonProps) => <Button variant="secondary" {...props} />,
  Text: (props: ButtonProps) => <Button variant="text" {...props} />,
  Danger: (props: ButtonProps) => <Button variant="danger" {...props} />,
}