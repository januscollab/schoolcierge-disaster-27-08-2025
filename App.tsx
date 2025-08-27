import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './app/navigation/RootNavigator';
import { config } from './tamagui.config';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={config}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </TamaguiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}