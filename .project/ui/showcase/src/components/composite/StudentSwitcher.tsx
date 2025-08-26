import { GetProps, HStack, Stack, Text, styled } from 'tamagui'
import { Card } from '../core/Card'

// Create student card component
const StudentCard = styled(Card, {
  name: 'StudentCard',
  
  // Default styles
  width: 140,
  height: 72,
  padding: 12,
  marginRight: 12,
  borderRadius: 12,
  
  // Variants
  variants: {
    selected: {
      true: {
        backgroundColor: '$neutral.white',
        borderWidth: 0,
      },
      false: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
      },
    },
  },
})

// Create student switcher component
export const StudentSwitcher = ({
  students,
  selectedId,
  onSelect,
  variant = 'horizontal',
  ...props
}: StudentSwitcherProps) => {
  if (variant === 'dropdown') {
    // TODO: Implement dropdown variant
    return null
  }

  return (
    <HStack 
      horizontal 
      showsHorizontalScrollIndicator={false}
      {...props}
    >
      {students.map((student) => (
        <StudentCard
          key={student.id}
          selected={student.id === selectedId}
          onPress={() => onSelect(student.id)}
          animation="quick"
          pressStyle={{ scale: 0.95 }}
        >
          <Stack>
            {/* Avatar */}
            <Stack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor={getGradeColor(student.grade)}
              alignItems="center"
              justifyContent="center"
              marginBottom="$2"
            >
              <Text color="$neutral.white" fontSize="$caption">
                {student.grade}
              </Text>
            </Stack>

            {/* Name */}
            <Text
              fontSize="$bodySmall"
              fontWeight="600"
              color={student.id === selectedId ? '$neutral.black' : '$neutral.white'}
              numberOfLines={1}
            >
              {student.name}
            </Text>
          </Stack>
        </StudentCard>
      ))}
    </HStack>
  )
}

// Types
export interface Student {
  id: string
  name: string
  grade: string
  avatar?: string
}

export type StudentSwitcherProps = GetProps<typeof HStack> & {
  students: Student[]
  selectedId: string
  onSelect: (studentId: string) => void
  variant?: 'horizontal' | 'dropdown'
}

// Helper functions
const getGradeColor = (grade: string) => {
  // Return color based on grade level
  const gradeNum = parseInt(grade)
  if (gradeNum <= 5) return '$primary.gold' // Elementary
  if (gradeNum <= 8) return '$primary.periwinkle' // Middle
  return '$primary.deepPurple' // High school
}

// Export variations for storybook
export const StudentSwitcherVariants = {
  TwoStudents: (props: Partial<StudentSwitcherProps>) => (
    <StudentSwitcher
      students={[
        { id: '1', name: 'Emma Smith', grade: '3' },
        { id: '2', name: 'Liam Smith', grade: '5' },
      ]}
      selectedId="1"
      onSelect={() => {}}
      {...props}
    />
  ),
  ThreeStudents: (props: Partial<StudentSwitcherProps>) => (
    <StudentSwitcher
      students={[
        { id: '1', name: 'Emma Smith', grade: '3' },
        { id: '2', name: 'Liam Smith', grade: '5' },
        { id: '3', name: 'Noah Smith', grade: '8' },
      ]}
      selectedId="1"
      onSelect={() => {}}
      {...props}
    />
  ),
  FourStudents: (props: Partial<StudentSwitcherProps>) => (
    <StudentSwitcher
      students={[
        { id: '1', name: 'Emma Smith', grade: '3' },
        { id: '2', name: 'Liam Smith', grade: '5' },
        { id: '3', name: 'Noah Smith', grade: '8' },
        { id: '4', name: 'Olivia Smith', grade: '10' },
      ]}
      selectedId="1"
      onSelect={() => {}}
      {...props}
    />
  ),
}