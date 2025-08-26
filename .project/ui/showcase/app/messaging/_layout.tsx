import { Stack } from 'expo-router'

export default function MessagingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3D348B',
        },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Smart Messaging',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  )
}