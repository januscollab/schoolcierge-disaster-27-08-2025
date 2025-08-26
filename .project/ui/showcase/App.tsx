import { TamaguiProvider, Theme } from 'tamagui'
import { useFonts } from 'expo-font'
import config from './tamagui.config'
import { Navigator } from './src/navigation/Navigator'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function App() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  if (!loaded) {
    return null
  }

  return (
    <TamaguiProvider config={config}>
      <Theme name="light">
        <SafeAreaProvider>
          <Navigator />
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  )
}