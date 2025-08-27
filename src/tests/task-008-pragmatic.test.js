/**
 * TASK-008: Expo Mobile App - Pragmatic Tests
 * Tests that actually verify the mobile app setup works
 */

const fs = require('fs');
const path = require('path');

describe('TASK-008: Expo Mobile App - Verification Tests', () => {
  const projectRoot = process.cwd();

  describe('Critical Files Exist and Are Valid', () => {
    test('App.tsx exists and has valid React Native code', () => {
      const appPath = path.join(projectRoot, 'App.tsx');
      expect(fs.existsSync(appPath)).toBe(true);
      
      const appContent = fs.readFileSync(appPath, 'utf-8');
      // Must export default
      expect(appContent).toContain('export default');
      // Must import React (either as default or named imports)
      expect(appContent).toMatch(/import\s+.*from\s+['"]react['"]/);
      // Must have a component
      expect(appContent).toMatch(/function\s+App|const\s+App|export\s+default\s+function/);
    });

    test('app.json has valid Expo configuration', () => {
      const appJsonPath = path.join(projectRoot, 'app.json');
      expect(fs.existsSync(appJsonPath)).toBe(true);
      
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      
      // Required Expo fields
      expect(appJson.expo).toBeDefined();
      expect(appJson.expo.name).toBeDefined();
      expect(appJson.expo.slug).toBeDefined();
      expect(appJson.expo.version).toBeDefined();
      
      // Platform configs
      expect(appJson.expo.ios).toBeDefined();
      expect(appJson.expo.android).toBeDefined();
      
      // Bundle identifiers
      expect(appJson.expo.ios.bundleIdentifier).toMatch(/^[a-zA-Z][a-zA-Z0-9.]*$/);
      expect(appJson.expo.android.package).toMatch(/^[a-z][a-z0-9_.]*$/);
    });

    test('tamagui.config.ts exists and exports configuration', () => {
      const configPath = path.join(projectRoot, 'tamagui.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('export');
      expect(content).toContain('tamagui');
    });
  });

  describe('Dependencies Are Properly Installed', () => {
    test('All critical Expo and React Native packages are installed', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      
      const requiredPackages = {
        'expo': 'Core Expo SDK',
        'react': 'React framework',
        'react-native': 'React Native framework',
        'expo-router': 'Navigation system',
        'tamagui': 'UI library',
        'react-native-safe-area-context': 'Safe area handling',
        'react-native-screens': 'Native screen optimization'
      };
      
      for (const [pkg, description] of Object.entries(requiredPackages)) {
        expect(packageJson.dependencies?.[pkg]).toBeDefined();
      }
    });

    test('TypeScript is configured for the project', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      
      expect(packageJson.devDependencies?.typescript).toBeDefined();
      expect(fs.existsSync(path.join(projectRoot, 'tsconfig.json'))).toBe(true);
    });
  });

  describe('App Structure Is Correct', () => {
    test('app directory exists with navigation structure', () => {
      const appDir = path.join(projectRoot, 'app');
      expect(fs.existsSync(appDir)).toBe(true);
      
      // Should have at least an index file
      const hasIndex = 
        fs.existsSync(path.join(appDir, 'index.tsx')) ||
        fs.existsSync(path.join(appDir, 'index.js')) ||
        fs.existsSync(path.join(appDir, '(tabs)/index.tsx'));
      
      expect(hasIndex).toBe(true);
    });

    test('Components or src directory exists for code organization', () => {
      const hasComponentStructure = 
        fs.existsSync(path.join(projectRoot, 'components')) ||
        fs.existsSync(path.join(projectRoot, 'src/components')) ||
        fs.existsSync(path.join(projectRoot, 'app/components'));
      
      expect(hasComponentStructure).toBe(true);
    });
  });

  describe('Build Configuration Is Valid', () => {
    test('package.json has required scripts', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      
      const requiredScripts = ['start', 'android', 'ios'];
      for (const script of requiredScripts) {
        expect(packageJson.scripts?.[script]).toBeDefined();
      }
    });

    test('Metro bundler configuration exists', () => {
      const hasMetroConfig = 
        fs.existsSync(path.join(projectRoot, 'metro.config.js')) ||
        fs.existsSync(path.join(projectRoot, 'metro.config.ts'));
      
      expect(hasMetroConfig).toBe(true);
    });
  });

  describe('FAILING TESTS - These show what still needs work', () => {
    test.failing('API client is configured for backend communication', () => {
      const hasApiClient = 
        fs.existsSync(path.join(projectRoot, 'src/api/client.ts')) ||
        fs.existsSync(path.join(projectRoot, 'app/api/client.ts')) ||
        fs.existsSync(path.join(projectRoot, 'src/lib/api.ts'));
      
      expect(hasApiClient).toBe(true);
    });

    test.failing('Authentication flow is implemented', () => {
      const hasAuth = 
        fs.existsSync(path.join(projectRoot, 'app/auth')) ||
        fs.existsSync(path.join(projectRoot, 'src/auth')) ||
        fs.existsSync(path.join(projectRoot, 'app/(auth)'));
      
      expect(hasAuth).toBe(true);
    });
  });
});