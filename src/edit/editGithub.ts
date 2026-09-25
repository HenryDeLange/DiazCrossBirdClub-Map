import type { FeatureCollection, Geometry } from 'geojson';
import type { FeatureProps } from '../map/geojson/types';

export const repositoryOwner = 'HenryDeLange';
export const repositoryName = 'DiazCrossBirdClub-Map';
export const defaultBranch = 'main';
type LocationType = 'outings' | 'paths' | 'points' | 'spots';
type GeoCollection = FeatureCollection<Geometry, FeatureProps>;

export type GitHubGeoJsonFile = {
    name: string;
    path: string;
    type: LocationType;
}

const geoJsonModules = import.meta.glob<GeoCollection>('../assets/geojson/**/*.json', {
    eager: true,
    import: 'default'
});

const bundledFiles: GitHubGeoJsonFile[] = Object.keys(geoJsonModules).map((modulePath) => {
    const path = modulePath.replace('../assets/geojson/', 'src/assets/geojson/');
    const type = path.split('/')[3] as LocationType;
    return { name: path.split('/').at(-1) ?? '', path, type };
});

export function getGeoJsonFiles(): GitHubGeoJsonFile[] {
    return [...bundledFiles].sort((left, right) => left.path.localeCompare(right.path));
}

export async function getGeoJsonFile(path: string): Promise<GeoCollection> {
    const modulePath = path.replace('src/assets/geojson/', '../assets/geojson/');
    const collection = geoJsonModules[modulePath];
    if (!collection || !bundledFiles.some((candidate) => candidate.path === path)) {
        throw new Error(`GeoJSON file is not available in this editor: ${path}`);
    }
    return structuredClone(collection);
}

export function getGitHubFileUrl(path: string, action: 'edit' | 'new' | 'delete', branch = defaultBranch): string {
    const targetPath = action === 'new' ? path.slice(0, path.lastIndexOf('/')) : path;
    const encodedBranch = encodeURIComponent(branch);
    const encodedPath = targetPath.split('/').map(encodeURIComponent).join('/');
    return `https://github.com/${repositoryOwner}/${repositoryName}/${action}/${encodedBranch}/${encodedPath}`;
}