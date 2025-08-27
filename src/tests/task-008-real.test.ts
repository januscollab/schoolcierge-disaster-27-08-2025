/**
 * TASK-008 REAL TESTS
 * Actual functional tests for Expo Mobile App
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('TASK-008: Expo Mobile App - REAL FUNCTIONAL TESTS', () => {
  const projectRoot = process.cwd();

  describe('App Component Tests', () => {
    it('should have a valid App.tsx that exports a component', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);
      
      const appContent = fs.readFileSync(appPath, 'utf-8');
      // Check it exports something
      expect(appContent).toMatch(/export\s+(default|{)/);
      // Check it imports React or React Native
      expect(appContent).toMatch(/import.*from\s+['"]react/);
    });

    it('should have valid TypeScript syntax in App.tsx', () => {
      try {
        // Try to compile the TypeScript file
        execSync('npx tsc --noEmit App.tsx', { 
          cwd: projectRoot,
          stdio: 'pipe' 
        });
      } catch (error: any) {
        // If TypeScript compilation fails, the test should fail
        throw new Error(`TypeScript compilation failed: ${error.stdout || error.message}`);
      }
    });
  });

  describe('Navigation Configuration Tests', () => {
    it('should have app directory with navigation structure', () => {
      const appDir = path.join(projectRoot, 'app');
      expect(fs.existsSync(appDir)).toBe(true);
      
      // Check for essential navigation files
      const hasIndexFile = fs.existsSync(path.join(appDir, 'index.tsx')) ||
                          fs.existsSync(path.join(appDir, 'index.js'));
      expect(hasIndexFile).toBe(true);
    });

    it('should have proper Expo Router configuration', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      // Verify expo-router is installed
      expect(packageJson.dependencies?.['expo-router']).toBeDefined();
      
      // Verify main field points to expo-router
      expect(packageJson.main).toContain('expo-router');
    });
  });

  describe('Tamagui Configuration Tests', () => {
    it('should have tamagui.config.ts with valid configuration', () => {
      const configPath = path.join(projectRoot, 'tamagui.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const configContent = fs.readFileSync(configPath, 'utf-8');
      // Check it exports a config
      expect(configContent).toMatch(/export\s+/);
      // Check it imports from tamagui
      expect(configContent).toMatch(/from\s+['"]@tamagui/);
    });

    it('should compile tamagui config without errors', () => {
      try {
        execSync('npx tsc --noEmit tamagui.config.ts', { 
          cwd: projectRoot,
          stdio: 'pipe' 
        });
      } catch (error: any) {
        throw new Error(`Tamagui config compilation failed: ${error.stdout || error.message}`);
      }
    });
  });

  describe('Build and Runtime Tests', () => {
    it('should be able to run expo export without errors', () => {
      try {
        // Try to export the app (this validates the entire setup)
        const result = execSync('npx expo export --platform ios --output-dir ./test-export', { 
          cwd: projectRoot,
          stdio: 'pipe',
          timeout: 30000
        });
        
        // Clean up test export
        if (fs.existsSync(path.join(projectRoot, 'test-export'))) {
          fs.rmSync(path.join(projectRoot, 'test-export'), { recursive: true });
        }
      } catch (error: any) {
        throw new Error(`Expo export failed: ${error.stdout || error.message}`);
      }
    });

    it('should have all required Expo modules installed and configured', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      // Critical dependencies that MUST be present
      const requiredDeps = [
        'expo',
        'react',
        'react-native',
        'expo-status-bar',
        'expo-router',
        'react-native-safe-area-context',
        'react-native-screens',
        'tamagui'
      ];
      
      for (const dep of requiredDeps) {
        expect(packageJson.dependencies?.[dep]).toBeDefined();
      }
    });
  });

  describe('API Integration Tests', () => {
    it('should have API configuration for backend communication', () => {
      // Check for API client setup
      const hasApiConfig = 
        fs.existsSync(path.join(projectRoot, 'src/api/client.ts')) ||
        fs.existsSync(path.join(projectRoot, 'app/api/client.ts')) ||
        fs.existsSync(path.join(projectRoot, 'src/lib/api.ts'));
      
      expect(hasApiConfig).toBe(true);
    });

    it('should have environment variable configuration', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      // Check for env management
      const hasEnvSupport = 
        packageJson.dependencies?.['expo-constants'] ||
        packageJson.dependencies?.['react-native-dotenv'] ||
        packageJson.dependencies?.['expo-env'];
      
      expect(hasEnvSupport).toBeTruthy();
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should have proper iOS configuration in app.json', () => {
      const appJsonPath = path.join(projectRoot, 'app.json');
      if (fs.existsSync(appJsonPath)) {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
        
        expect(appJson.expo).toBeDefined();
        expect(appJson.expo.ios).toBeDefined();
        expect(appJson.expo.ios.bundleIdentifier).toBeDefined();
        expect(appJson.expo.ios.bundleIdentifier).toMatch(/^[a-z][a-z0-9.]*$/i);
      }
    });

    it('should have proper Android configuration in app.json', () => {
      const appJsonPath = path.join(projectRoot, 'app.json');
      if (fs.existsSync(appJsonPath)) {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
        
        expect(appJson.expo).toBeDefined();
        expect(appJson.expo.android).toBeDefined();
        expect(appJson.expo.android.package).toBeDefined();
        expect(appJson.expo.android.package).toMatch(/^[a-z][a-z0-9_.]*$/);
      }
    });
  });
});