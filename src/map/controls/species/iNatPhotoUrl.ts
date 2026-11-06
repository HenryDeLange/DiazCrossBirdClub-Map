export type INatPhotoSize = 'medium' | 'large' | 'original';

export function getINatPhotoUrl(url: string | undefined, size: INatPhotoSize): string | undefined {
    if (!url) {
        return undefined;
    }

    try {
        const imageUrl = new URL(url);
        if (!imageUrl.hostname.includes('inaturalist')) {
            return undefined;
        }

        const sizePattern = /\/(square|small|medium|large|original)(?=\.[^/.]+$)/i;
        if (!sizePattern.test(imageUrl.pathname)) {
            return undefined;
        }

        imageUrl.pathname = imageUrl.pathname.replace(sizePattern, `/${size}`);
        return imageUrl.toString();
    } catch {
        return undefined;
    }
}
