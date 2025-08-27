import { config as configBase } from '@tamagui/config';
import { createTamagui } from '@tamagui/core';

export const config = createTamagui({
  ...configBase,
  themes: {
    ...configBase.themes,
    // Add custom themes here if needed
  },
});

export default config;

export type Conf = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}