export type ThemePreference = 'system' | 'light' | 'dark';

const themeStorageKey = 'themePreference';

export function getStoredThemePreference(): ThemePreference {
    if (typeof window === 'undefined') {
        return 'system';
    }

    try {
        const storedPreference = window.localStorage.getItem(themeStorageKey);
        if (storedPreference === 'light' || storedPreference === 'dark') {
            return storedPreference;
        }
    }
    catch {
        return 'system';
    }

    return 'system';
}

export function getSystemDarkMode(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function storeThemePreference(preference: ThemePreference): void {
    try {
        window.localStorage.setItem(themeStorageKey, preference);
    }
    catch {
        return;
    }
}

export function applyThemePreference(preference: ThemePreference): void {
    if (typeof document === 'undefined') {
        return;
    }

    if (preference === 'system') {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.style.removeProperty('color-scheme');
        return;
    }

    document.documentElement.dataset.theme = preference;
    document.documentElement.style.colorScheme = preference;
}

export function getNextThemePreference(preference: ThemePreference): ThemePreference {
    if (preference === 'system') {
        return 'light';
    }

    return preference === 'light' ? 'dark' : 'system';
}

export function getThemeLabel(preference: ThemePreference): string {
    return preference === 'system' ? 'System' : preference === 'light' ? 'Light' : 'Dark';
}