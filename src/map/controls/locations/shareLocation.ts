import { getLocationUrl } from '../../locationUtils';

export function shareLocation(locationName: string) {
    const shareUrl = getLocationUrl(locationName);

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
        const canShare = typeof navigator.canShare !== 'function' || navigator.canShare({ url: shareUrl });

        if (canShare) {
            return navigator.share({
                title: locationName,
                text: `Birding location: ${locationName}`,
                url: shareUrl
            }).catch(() => undefined);
        }
    }

    if (typeof window !== 'undefined') {
        window.prompt('Copy location link', shareUrl);
    }

    return Promise.resolve();
}
