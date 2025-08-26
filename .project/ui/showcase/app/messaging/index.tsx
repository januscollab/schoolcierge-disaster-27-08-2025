import { ScrollView, YStack, Text, Card, XStack, Circle, Button, View } from 'tamagui'
import { AlertCircle, Clock, Award, BookOpen, CheckCircle } from '@tamagui/lucide-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'

export default function MessagingDemo() {
  const insets = useSafeAreaInsets()
  const [selectedPriority, setSelectedPriority] = useState('all')

  const priorities = [
    {
      id: 'critical',
      label: 'Critical',
      icon: AlertCircle,
      color: '#F35B04',
      gradient: ['#F35B04', '#F18701']
    },
    {
      id: 'urgent',
      label: 'Urgent',
      icon: Clock,
      color: '#F18701',
      gradient: ['#F18701', '#F7B801']
    },
    {
      id: 'achievement',
      label: 'Achievement',
      icon: Award,
      color: '#F7B801',
      gradient: ['#F7B801', '#4CAF50']
    },
    {
      id: 'academic',
      label: 'Academic',
      icon: BookOpen,
      color: '#7678ED',
      gradient: ['#7678ED', '#3D348B']
    }
  ]

  const messages = [
    {
      id: 1,
      priority: 'critical',
      title: 'Emergency Early Dismissal',
      from: 'Principal Wilson',
      time: '5m ago',
      preview: 'Due to severe weather conditions, school will be dismissed at 1:00 PM today.',
      actions: ['Acknowledge', 'View Details']
    },
    {
      id: 2,
      priority: 'urgent',
      title: 'Permission Slip Due Tomorrow',
      from: 'Mrs. Johnson - 3rd Grade',
      time: '2h ago',
      preview: 'Please submit the signed field trip permission slip by tomorrow morning.',
      actions: ['Sign Form', 'Remind Later']
    },
    {
      id: 3,
      priority: 'achievement',
      title: 'Student of the Month! 🎉',
      from: 'Academic Office',
      time: '1d ago',
      preview: 'Congratulations! Your child has been selected as Student of the Month for outstanding academic performance.',
      actions: ['View Certificate', 'Share']
    },
    {
      id: 4,
      priority: 'academic',
      title: 'Math Quiz Results',
      from: 'Mr. Thompson',
      time: '2d ago',
      preview: 'Latest quiz scores and areas for improvement are now available.',
      actions: ['View Results', 'Schedule Conference']
    }
  ]

  const getPriorityStyles = (priority: string) => {
    const priorityConfig = priorities.find(p => p.id === priority)
    return {
      icon: priorityConfig?.icon || CheckCircle,
      color: priorityConfig?.color || '#4A4A4A',
      gradient: priorityConfig?.gradient || ['#4A4A4A', '#757575']
    }
  }

  return (
    <ScrollView backgroundColor="$background">
      <YStack padding="$4" paddingBottom={insets.bottom + 16} space="$4">
        {/* Priority Filter */}
        <XStack space="$2">
          <Button
            size="$3"
            borderRadius={20}
            backgroundColor={selectedPriority === 'all' ? '$primary' : '$background'}
            borderWidth={2}
            borderColor="$primary"
            color={selectedPriority === 'all' ? '#FFF' : '$primary'}
            onPress={() => setSelectedPriority('all')}
          >
            All
          </Button>
          {priorities.map((priority) => (
            <Button
              key={priority.id}
              size="$3"
              borderRadius={20}
              backgroundColor={selectedPriority === priority.id ? priority.color : '$background'}
              borderWidth={2}
              borderColor={priority.color}
              color={selectedPriority === priority.id ? '#FFF' : priority.color}
              onPress={() => setSelectedPriority(priority.id)}
            >
              {priority.label}
            </Button>
          ))}
        </XStack>

        {/* Messages List */}
        <YStack space="$3">
          {messages
            .filter(m => selectedPriority === 'all' || m.priority === selectedPriority)
            .map((message) => {
              const styles = getPriorityStyles(message.priority)
              const Icon = styles.icon

              return (
                <Card
                  key={message.id}
                  elevate
                  animation="quick"
                  pressStyle={{ scale: 0.98 }}
                  borderRadius={16}
                  overflow="hidden"
                >
                  <LinearGradient
                    colors={styles.gradient}
                    style={{ padding: 2 }}
                  >
                    <Card backgroundColor="$background" borderRadius={14}>
                      <YStack padding="$3" space="$3">
                        <XStack space="$3" alignItems="center">
                          <Circle size={44} backgroundColor={`${styles.color}15`}>
                            <Icon size={24} color={styles.color} />
                          </Circle>
                          <YStack flex={1}>
                            <Text fontSize={16} fontWeight="600" color="$text">
                              {message.title}
                            </Text>
                            <Text fontSize={12} color="$gray">
                              {message.from} • {message.time}
                            </Text>
                          </YStack>
                        </XStack>

                        <Text fontSize={14} color="$gray" numberOfLines={2}>
                          {message.preview}
                        </Text>

                        <XStack space="$2">
                          {message.actions.map((action, i) => (
                            <Button
                              key={i}
                              size="$3"
                              theme={i === 0 ? 'primary' : 'secondary'}
                              borderRadius={8}
                            >
                              {action}
                            </Button>
                          ))}
                        </XStack>
                      </YStack>
                    </Card>
                  </LinearGradient>
                </Card>
              )
            })}
        </YStack>
      </YStack>
    </ScrollView>
  )
}