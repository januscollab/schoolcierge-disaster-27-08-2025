/**
 * TASK-008 Specific Tests
 * Tests ONLY for Expo Mobile App Setup
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('TASK-008: Expo Mobile App Setup', () => {
  let packageJson: any;

  beforeAll(() => {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  });

  describe('Setup Verification (NOT REAL TESTS - Just checking files exist)', () => {
    it('should have Expo SDK installed', () => {
      const hasExpo = packageJson.dependencies?.['expo'];
      expect(hasExpo).toBeDefined();
    });

    it('should use Expo SDK 50 or higher', () => {
      const expoVersion = packageJson.dependencies?.['expo'];
      if (expoVersion) {
        const versionMatch = expoVersion.match(/(\d+)/);
        if (versionMatch) {
          const majorVersion = parseInt(versionMatch[1]);
          expect(majorVersion).toBeGreaterThanOrEqual(50);
        }
      }
    });

    it('should have TypeScript configured', () => {
      const hasTypeScript = packageJson.devDependencies?.['typescript'];
      const hasTSConfig = fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));
      
      expect(hasTypeScript).toBeDefined();
      expect(hasTSConfig).toBe(true);
    });

    it('should have React Navigation installed', () => {
      const hasNavigation = packageJson.dependencies?.['@react-navigation/native'] ||
                           packageJson.dependencies?.['expo-router'];
      expect(hasNavigation).toBeDefined();
    });

    it('should have Tamagui UI library installed', () => {
      const hasTamagui = packageJson.dependencies?.['tamagui'] ||
                        packageJson.dependencies?.['@tamagui/core'];
      expect(hasTamagui).toBeDefined();
    });

    it('should have proper mobile app structure', () => {
      const hasAppDirectory = fs.existsSync(path.join(process.cwd(), 'app')) ||
                             fs.existsSync(path.join(process.cwd(), 'src/app'));
      expect(hasAppDirectory).toBe(true);
    });

    it('should have Expo configuration file', () => {
      const hasExpoConfig = fs.existsSync(path.join(process.cwd(), 'app.json')) ||
                           fs.existsSync(path.join(process.cwd(), 'app.config.js')) ||
                           fs.existsSync(path.join(process.cwd(), 'app.config.ts'));
      expect(hasExpoConfig).toBe(true);
    });

    it('should have React Native dependencies', () => {
      const hasReactNative = packageJson.dependencies?.['react-native'];
      const hasReact = packageJson.dependencies?.['react'];
      
      expect(hasReactNative).toBeDefined();
      expect(hasReact).toBeDefined();
    });

    it('should have safe area context for mobile', () => {
      const hasSafeArea = packageJson.dependencies?.['react-native-safe-area-context'];
      expect(hasSafeArea).toBeDefined();
    });
  });

  describe('🚨 REAL TESTS NEEDED', () => {
    it.skip('should render App component without crashing', () => {
      // TODO: Actually import and test App.tsx
      // const App = require('../../App.tsx');
      // expect(() => render(<App />)).not.toThrow();
    });

    it.skip('should handle navigation between screens', () => {
      // TODO: Test actual navigation
    });

    it.skip('should connect to API endpoints', () => {
      // TODO: Test actual API calls from mobile app
    });

    it.skip('should handle authentication flow', () => {
      // TODO: Test actual auth flow
    });
  });
});