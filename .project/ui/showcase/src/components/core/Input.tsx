import { GetProps, Input as TamaguiInput, Label, Stack, Text, styled } from 'tamagui'

// Create base input component
const StyledInput = styled(TamaguiInput, {
  name: 'Input',
  
  // Default styles
  height: 44,
  backgroundColor: '$neutral.offWhite',
  borderWidth: 1,
  borderColor: '$neutral.lightGray',
  borderRadius: 8,
  paddingHorizontal: 12,
  fontSize: 16,
  
  // Variants
  variants: {
    state: {
      default: {},
      focused: {
        borderColor: '$primary.deepPurple',
        borderWidth: 2,
      },
      error: {
        borderColor: '$semantic.error',
      },
      success: {
        borderColor: '$semantic.success',
      },
      warning: {
        borderColor: '$semantic.warning',
      },
    },
  },
  
  // Default variant
  defaultVariants: {
    state: 'default',
  },
})

// Create input container with label and helper text
export const Input = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: InputProps) => {
  return (
    <Stack space="$2">
      {label && (
        <Label htmlFor={props.id} color="$neutral.darkGray" fontSize={14}>
          {label}
        </Label>
      )}
      
      <Stack>
        {leftIcon && (
          <Stack position="absolute" left="$3" top="50%" transform={[{ translateY: -10 }]}>
            {leftIcon}
          </Stack>
        )}
        
        <StyledInput
          {...props}
          pl={leftIcon ? '$9' : '$3'}
          pr={rightIcon ? '$9' : '$3'}
          state={error ? 'error' : props.state}
        />
        
        {rightIcon && (
          <Stack
            position="absolute"
            right="$3"
            top="50%"
            transform={[{ translateY: -10 }]}
            opacity={props.disabled ? 0.4 : 1}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </Stack>
        )}
      </Stack>
      
      {(helperText || error) && (
        <Text
          fontSize={12}
          color={error ? '$semantic.error' : '$neutral.gray'}
          marginTop="$1"
        >
          {error || helperText}
        </Text>
      )}
    </Stack>
  )
}

// Types
export type InputProps = GetProps<typeof StyledInput> & {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
}

// Export variations for storybook
export const InputVariants = {
  Default: (props: InputProps) => <Input {...props} />,
  WithLabel: (props: InputProps) => <Input label="Label" {...props} />,
  WithHelper: (props: InputProps) => (
    <Input label="Label" helperText="Helper text" {...props} />
  ),
  WithError: (props: InputProps) => (
    <Input label="Label" error="Error message" {...props} />
  ),
}