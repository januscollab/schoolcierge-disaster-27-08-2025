import { GetProps, Stack, Text, styled } from 'tamagui'

// Create base badge component
const StyledBadge = styled(Stack, {
  name: 'Badge',
  
  // Default styles
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  
  // Variants
  variants: {
    variant: {
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      number: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
      },
      text: {
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
      },
    },
    color: {
      primary: {
        backgroundColor: '$primary.deepPurple',
      },
      success: {
        backgroundColor: '$semantic.success',
      },
      warning: {
        backgroundColor: '$semantic.warning',
      },
      error: {
        backgroundColor: '$semantic.error',
      },
      info: {
        backgroundColor: '$semantic.info',
      },
    },
    position: {
      'top-right': {
        position: 'absolute',
        top: -2,
        right: -2,
      },
      'top-left': {
        position: 'absolute',
        top: -2,
        left: -2,
      },
      inline: {
        position: 'relative',
      },
    },
    size: {
      small: {
        transform: [{ scale: 0.8 }],
      },
      medium: {
        transform: [{ scale: 1 }],
      },
    },
  },
  
  // Default variant
  defaultVariants: {
    variant: 'dot',
    color: 'error',
    position: 'top-right',
    size: 'medium',
  },
})

// Create badge component with value
export const Badge = ({ value, ...props }: BadgeProps) => {
  return (
    <StyledBadge {...props}>
      {props.variant !== 'dot' && value && (
        <Text
          color="$neutral.white"
          fontSize={10}
          fontWeight="500"
          lineHeight={14}
          textAlign="center"
        >
          {value}
        </Text>
      )}
    </StyledBadge>
  )
}

// Types
export type BadgeProps = GetProps<typeof StyledBadge> & {
  value?: string | number
}

// Export variations for storybook
export const BadgeVariants = {
  Dot: (props: BadgeProps) => <Badge variant="dot" {...props} />,
  Number: (props: BadgeProps) => <Badge variant="number" value="3" {...props} />,
  Text: (props: BadgeProps) => <Badge variant="text" value="New" {...props} />,
}