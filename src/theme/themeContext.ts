import { createContext } from 'react';
import type { ThemePreference } from './theme';

export type ThemeContextValue = {
    preference: ThemePreference;
    isDarkMode: boolean;
    cyclePreference: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);