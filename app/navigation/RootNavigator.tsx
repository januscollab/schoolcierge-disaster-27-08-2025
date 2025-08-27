import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, MessageCircle, Settings, User } from '@tamagui/lucide-icons';
import { YStack, Text } from 'tamagui';

// Placeholder screens
const HomeScreen = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
    <Text fontSize="$6" fontWeight="600">Welcome to SchoolCierge</Text>
    <Text fontSize="$4" color="$gray11" textAlign="center" marginTop="$2">
      Your intelligent school communications platform
    </Text>
  </YStack>
);

const MessagesScreen = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
    <MessageCircle size={48} color="$blue10" />
    <Text fontSize="$6" fontWeight="600" marginTop="$4">Messages</Text>
    <Text fontSize="$4" color="$gray11" textAlign="center" marginTop="$2">
      View and respond to school communications
    </Text>
  </YStack>
);

const SettingsScreen = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
    <Settings size={48} color="$gray10" />
    <Text fontSize="$6" fontWeight="600" marginTop="$4">Settings</Text>
    <Text fontSize="$4" color="$gray11" textAlign="center" marginTop="$2">
      Configure your app preferences
    </Text>
  </YStack>
);

const ProfileScreen = () => (
  <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
    <User size={48} color="$green10" />
    <Text fontSize="$6" fontWeight="600" marginTop="$4">Profile</Text>
    <Text fontSize="$4" color="$gray11" textAlign="center" marginTop="$2">
      Manage your account and preferences
    </Text>
  </YStack>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let IconComponent;
        
        switch (route.name) {
          case 'Home':
            IconComponent = Home;
            break;
          case 'Messages':
            IconComponent = MessageCircle;
            break;
          case 'Settings':
            IconComponent = Settings;
            break;
          case 'Profile':
            IconComponent = User;
            break;
          default:
            IconComponent = Home;
        }
        
        return <IconComponent size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const RootNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={TabNavigator} />
  </Stack.Navigator>
);