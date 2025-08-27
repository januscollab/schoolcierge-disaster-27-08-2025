import Constants from 'expo-constants';

interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  clerkPublishableKey?: string;
  sentryDsn?: string;
  debugMode: boolean;
}

const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (__DEV__) return 'development';
  
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  if (releaseChannel === 'staging') return 'staging';
  
  return 'production';
};

export const config: AppConfig = {
  environment: getEnvironment(),
  version: Constants.expoConfig?.version || '1.0.0',
  debugMode: __DEV__,
  
  // API Configuration
  apiUrl: Constants.expoConfig?.extra?.apiUrl || 
          process.env.EXPO_PUBLIC_API_URL || 
          'http://localhost:3000/api',
  
  // Authentication
  clerkPublishableKey: Constants.expoConfig?.extra?.clerkPublishableKey ||
                      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  
  // Error tracking
  sentryDsn: Constants.expoConfig?.extra?.sentryDsn ||
            process.env.EXPO_PUBLIC_SENTRY_DSN,
};

export default config;