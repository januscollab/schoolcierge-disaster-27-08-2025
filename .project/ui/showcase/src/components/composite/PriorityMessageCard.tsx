import { GetProps } from 'tamagui'
import { HStack, Text, VStack } from 'tamagui'
import { Card } from '../core/Card'
import { Button } from '../core/Button'
import { Badge } from '../core/Badge'

// Create priority message card
export const PriorityMessageCard = ({
  priority,
  from,
  fromRole,
  subject,
  preview,
  timestamp,
  unread,
  requiresAction,
  studentName,
  onPress,
  onActionPress,
  ...props
}: PriorityMessageCardProps) => {
  return (
    <Card
      variant="priority"
      priority={priority}
      {...props}
      onPress={onPress}
      animation="quick"
      pressStyle={{ scale: 0.98 }}
    >
      <HStack space="$3" alignItems="flex-start">
        {/* Avatar or Icon */}
        <VStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={getPriorityColor(priority)}
          alignItems="center"
          justifyContent="center"
        >
          {/* Icon based on fromRole */}
          {getRoleIcon(fromRole)}
        </VStack>

        {/* Content */}
        <VStack flex={1} space="$2">
          {/* Header */}
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              flex={1}
              fontSize="$h3"
              fontWeight="600"
              color="$neutral.black"
              numberOfLines={1}
            >
              {subject}
            </Text>
            <Text fontSize="$caption" color="$neutral.gray">
              {formatTimestamp(timestamp)}
            </Text>
          </HStack>

          {/* From */}
          <Text fontSize="$bodySmall" color="$neutral.darkGray">
            from {from} • {fromRole}
          </Text>

          {/* Preview */}
          <Text
            fontSize="$body"
            color="$neutral.darkGray"
            numberOfLines={2}
            marginBottom="$2"
          >
            {preview}
          </Text>

          {/* Footer */}
          <HStack justifyContent="space-between" alignItems="center">
            {/* Student Name */}
            {studentName && (
              <Text fontSize="$caption" color="$neutral.gray">
                Re: {studentName}
              </Text>
            )}

            {/* Action Button */}
            {requiresAction && (
              <Button
                variant="secondary"
                size="small"
                onPress={onActionPress}
              >
                Take Action
              </Button>
            )}
          </HStack>
        </VStack>

        {/* Unread Indicator */}
        {unread && (
          <Badge
            variant="dot"
            color="error"
            position="top-right"
            size="small"
          />
        )}
      </HStack>
    </Card>
  )
}

// Types
export type PriorityMessageCardProps = GetProps<typeof Card> & {
  priority: 'critical' | 'urgent' | 'achievement' | 'academic' | 'info'
  from: string
  fromRole: 'teacher' | 'principal' | 'nurse' | 'admin'
  subject: string
  preview: string
  timestamp: Date
  unread: boolean
  requiresAction?: boolean
  studentName?: string
  onPress: () => void
  onActionPress?: () => void
}

// Helper functions
const getPriorityColor = (priority: PriorityMessageCardProps['priority']) => {
  switch (priority) {
    case 'critical':
      return '$semantic.error'
    case 'urgent':
      return '$semantic.warning'
    case 'achievement':
      return '$primary.gold'
    case 'academic':
      return '$primary.periwinkle'
    case 'info':
      return '$primary.deepPurple'
  }
}

const getRoleIcon = (role: PriorityMessageCardProps['fromRole']) => {
  // Import and return appropriate Lucide icon based on role
  return null // TODO: Add icons
}

const formatTimestamp = (date: Date) => {
  // Format timestamp relative to now
  return '2h ago' // TODO: Add proper date formatting
}

// Export variations for storybook
export const PriorityMessageCardVariants = {
  Critical: (props: Partial<PriorityMessageCardProps>) => (
    <PriorityMessageCard
      priority="critical"
      from="Jane Smith"
      fromRole="nurse"
      subject="Urgent: Medical Update"
      preview="Your child has reported not feeling well..."
      timestamp={new Date()}
      unread={true}
      requiresAction={true}
      onPress={() => {}}
      {...props}
    />
  ),
  Urgent: (props: Partial<PriorityMessageCardProps>) => (
    <PriorityMessageCard
      priority="urgent"
      from="John Doe"
      fromRole="teacher"
      subject="Assignment Due Tomorrow"
      preview="Please submit the math homework by..."
      timestamp={new Date()}
      unread={true}
      requiresAction={false}
      onPress={() => {}}
      {...props}
    />
  ),
  Achievement: (props: Partial<PriorityMessageCardProps>) => (
    <PriorityMessageCard
      priority="achievement"
      from="Principal Wilson"
      fromRole="principal"
      subject="Academic Achievement!"
      preview="Congratulations! Your child has..."
      timestamp={new Date()}
      unread={false}
      requiresAction={false}
      onPress={() => {}}
      {...props}
    />
  ),
}