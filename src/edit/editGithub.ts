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

const geoJsonModules = import.meta.glob('../assets/geojson/**/*.json');

const bundledFiles: GitHubGeoJsonFile[] = Object.keys(geoJsonModules).map((modulePath) => {
    const path = modulePath.replace('../assets/geojson/', 'src/assets/geojson/');
    const type = path.split('/')[3] as LocationType;
    return { name: path.split('/').at(-1) ?? '', path, type };
});

export function getGeoJsonFiles(): GitHubGeoJsonFile[] {
    return [...bundledFiles].sort((left, right) => left.path.localeCompare(right.path));
}

export async function getGeoJsonFile(path: string): Promise<GeoCollection> {
    if (!bundledFiles.some((candidate) => candidate.path === path)) {
        throw new Error(`GeoJSON file is not available in this editor: ${path}`);
    }
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const url = `https://raw.githubusercontent.com/${repositoryOwner}/${repositoryName}/${defaultBranch}/${encodedPath}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load ${path} from the public ${defaultBranch} branch (HTTP ${response.status}).`);
    }
    return await response.json() as GeoCollection;
}

export function getGitHubFileUrl(path: string, action: 'edit' | 'new' | 'delete', branch = defaultBranch): string {
    const targetPath = action === 'new' ? path.slice(0, path.lastIndexOf('/')) : path;
    const encodedBranch = encodeURIComponent(branch);
    const encodedPath = targetPath.split('/').map(encodeURIComponent).join('/');
    return `https://github.com/${repositoryOwner}/${repositoryName}/${action}/${encodedBranch}/${encodedPath}`;
}