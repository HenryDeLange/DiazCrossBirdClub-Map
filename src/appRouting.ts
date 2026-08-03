import { getLocationSlugFromPathname } from './map/locationUtils';

export function isAstraPath(pathname: string): boolean {
    return getLocationSlugFromPathname(pathname) === 'astra';
}
