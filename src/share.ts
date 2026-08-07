export type ShareDetails = {
    title: string;
    text: string;
    url: string;
}

export function shareUrl({ title, text, url }: ShareDetails): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(url).catch(() => undefined);
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
        const canShare = typeof navigator.canShare !== 'function' || navigator.canShare({ url });

        if (canShare) {
            return navigator.share({ title, text, url }).catch(() => undefined);
        }
    }

    if (typeof window !== 'undefined') {
        window.prompt('Copy link', url);
    }

    return Promise.resolve();
}

export function getPageShareUrl(pathname: string, parameters: Record<string, string | number | undefined>): string {
    if (typeof window === 'undefined') {
        return pathname;
    }

    const url = new URL(window.location.href);
    url.pathname = pathname;
    url.search = '';

    Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}