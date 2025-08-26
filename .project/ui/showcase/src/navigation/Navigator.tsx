import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { ButtonPlayground } from '../screens/ButtonPlayground'
import { CardPlayground } from '../screens/CardPlayground'
import { InputPlayground } from '../screens/InputPlayground'
import { BadgePlayground } from '../screens/BadgePlayground'
import { CompositePlayground } from '../screens/CompositePlayground'
import { Button, Card, Keyboard, Layers } from '@tamagui/lucide-icons'

const Tab = createBottomTabNavigator()

export const Navigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#3D348B',
          tabBarInactiveTintColor: '#757575',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#D1D1D1',
            height: 60,
            paddingBottom: 8,
          },
          headerStyle: {
            backgroundColor: '#3D348B',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Buttons"
          component={ButtonPlayground}
          options={{
            tabBarIcon: ({ color }) => (
              <Button size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Cards"
          component={CardPlayground}
          options={{
            tabBarIcon: ({ color }) => (
              <Card size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Inputs"
          component={InputPlayground}
          options={{
            tabBarIcon: ({ color }) => (
              <Keyboard size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Badges"
          component={BadgePlayground}
          options={{
            tabBarIcon: ({ color }) => (
              <Button size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Composite"
          component={CompositePlayground}
          options={{
            tabBarIcon: ({ color }) => (
              <Layers size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}