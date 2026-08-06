export const ASTRA_PATH = 'astra';
export const TIDES_PATH = 'tides';

export function isAstraPath(pathname: string): boolean {
    return getAppPathSlug(pathname) === ASTRA_PATH;
}

export function isTidesPath(pathname: string): boolean {
    return getAppPathSlug(pathname) === TIDES_PATH;
}

function getAppPathSlug(pathname: string): string {
    const basePath = getBasePathname();
    const normalizedPath = pathname.replace(/\/+/g, '/');

    if (basePath !== '/' && normalizedPath.startsWith(basePath)) {
        return normalizedPath.slice(basePath.length).split('/').filter(Boolean)[0] ?? '';
    }

    return normalizedPath.split('/').filter(Boolean)[0] ?? '';
}

export function getBasePathname(): string {
    const basePath = import.meta.env.BASE_URL || '/';

    if (basePath === '/') {
        return '/';
    }

    return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

export function getAstraPathname(): string {
    return joinPath(getBasePathname(), ASTRA_PATH);
}

export function getTidesPathname(): string {
    return joinPath(getBasePathname(), TIDES_PATH);
}

export function joinPath(basePath: string, segment: string): string {
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

    if (!segment) {
        return normalizedBase;
    }

    return `${normalizedBase}${segment}`;
}
