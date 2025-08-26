import { ScrollView, YStack, H1, H2, Text, Card, XStack, Circle, Button } from 'tamagui'
import {
  GraduationCap,
  MessageCircle,
  Bell,
  Calendar,
  Users,
  Settings,
  BookOpen,
  Clock
} from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function Home() {
  const capabilities = [
    {
      title: "Smart Messaging",
      description: "AI-powered communication triage with priority handling",
      icon: MessageCircle,
      gradient: ['#3D348B', '#7678ED'],
      href: '/messaging',
      features: [
        "Priority message cards",
        "Smart categorization",
        "Quick action buttons",
        "Interactive responses"
      ]
    },
    {
      title: "Family Management",
      description: "Effortless multi-child organization and tracking",
      icon: Users,
      gradient: ['#F7B801', '#F18701'],
      href: '/family',
      features: [
        "Student switcher",
        "Individual timelines",
        "Progress tracking",
        "Family calendar"
      ]
    },
    {
      title: "Time-Sensitive Actions",
      description: "Never miss important deadlines or events",
      icon: Clock,
      gradient: ['#F35B04', '#F18701'],
      href: '/actions',
      features: [
        "Due date tracking",
        "Smart reminders",
        "Action prioritization",
        "Completion tracking"
      ]
    },
    {
      title: "Academic Tracking",
      description: "Keep track of assignments and achievements",
      icon: BookOpen,
      gradient: ['#7678ED', '#3D348B'],
      href: '/academic',
      features: [
        "Grade monitoring",
        "Assignment tracking",
        "Achievement badges",
        "Progress reports"
      ]
    }
  ]

  return (
    <ScrollView backgroundColor="$background">
      {/* Hero Section */}
      <YStack padding="$4" space="$4">
        <Card
          elevate
          bordered
          animation="quick"
          borderRadius={24}
          overflow="hidden"
        >
          <LinearGradient
            colors={['#3D348B', '#7678ED']}
            style={{ padding: 24 }}
          >
            <YStack space="$4" alignItems="center">
              <Circle size={100} backgroundColor="rgba(255,255,255,0.2)">
                <GraduationCap size={50} color="#FFF" />
              </Circle>
              <YStack space="$2" alignItems="center">
                <H1 color="#FFF" textAlign="center">
                  School'cierge
                </H1>
                <Text color="rgba(255,255,255,0.8)" textAlign="center">
                  Transforming school communications into organized, actionable insights
                </Text>
              </YStack>
            </YStack>
          </LinearGradient>
        </Card>

        {/* Capabilities Grid */}
        <H2 color="$text">Core Capabilities</H2>
        <YStack space="$4">
          {capabilities.map((capability, i) => (
            <Link key={i} href={capability.href as any} asChild>
              <Card
                elevate
                animation="quick"
                pressStyle={{ scale: 0.98 }}
                borderRadius={20}
                overflow="hidden"
              >
                <LinearGradient
                  colors={capability.gradient}
                  style={{ padding: 20 }}
                >
                  <YStack space="$3">
                    <XStack space="$3" alignItems="center">
                      <Circle size={50} backgroundColor="rgba(255,255,255,0.2)">
                        <capability.icon size={24} color="#FFF" />
                      </Circle>
                      <YStack flex={1}>
                        <Text color="#FFF" fontSize={20} fontWeight="600">
                          {capability.title}
                        </Text>
                        <Text color="rgba(255,255,255,0.8)" fontSize={14}>
                          {capability.description}
                        </Text>
                      </YStack>
                    </XStack>
                    
                    <YStack 
                      backgroundColor="rgba(255,255,255,0.1)"
                      padding="$3"
                      borderRadius={12}
                      space="$2"
                    >
                      {capability.features.map((feature, j) => (
                        <XStack key={j} space="$2" alignItems="center">
                          <Circle size={6} backgroundColor="#FFF" />
                          <Text color="#FFF" fontSize={14}>
                            {feature}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                </LinearGradient>
              </Card>
            </Link>
          ))}
        </YStack>

        {/* Experience Demo Button */}
        <Card
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={2}
          borderRadius={16}
          padding="$4"
          marginTop="$4"
        >
          <YStack space="$3" alignItems="center">
            <Text fontSize={18} fontWeight="600" color="$text" textAlign="center">
              Experience the Full Flow
            </Text>
            <Text fontSize={14} color="$gray" textAlign="center">
              Walk through a complete parent journey from onboarding to daily use
            </Text>
            <Button
              size="$5"
              theme="primary"
              icon={GraduationCap}
              borderRadius={12}
              onPress={() => {}}
            >
              Start Demo Flow
            </Button>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}