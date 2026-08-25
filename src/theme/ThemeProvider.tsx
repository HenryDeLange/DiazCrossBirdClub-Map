import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyThemePreference, getNextThemePreference, getStoredThemePreference, getSystemDarkMode, storeThemePreference, type ThemePreference } from './theme';
import { ThemeContext } from './themeContext';

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [preference, setPreference] = useState<ThemePreference>(getStoredThemePreference);
    const [systemIsDarkMode, setSystemIsDarkMode] = useState(getSystemDarkMode);

    useEffect(() => {
        applyThemePreference(preference);
        storeThemePreference(preference);
    }, [preference]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleColorSchemeChange = (event: MediaQueryListEvent) => setSystemIsDarkMode(event.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleColorSchemeChange);
            return () => mediaQuery.removeEventListener('change', handleColorSchemeChange);
        }

        mediaQuery.addListener(handleColorSchemeChange);
        return () => mediaQuery.removeListener(handleColorSchemeChange);
    }, []);

    const isDarkMode = preference === 'dark' || (preference === 'system' && systemIsDarkMode);
    const cyclePreference = useCallback(() => setPreference((currentPreference) => getNextThemePreference(currentPreference)), []);
    const contextValue = useMemo(() => ({ preference, isDarkMode, cyclePreference }), [preference, isDarkMode, cyclePreference]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}