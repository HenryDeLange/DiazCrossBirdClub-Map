import { shareUrl as shareAppUrl } from '../../../share';
import { getLocationUrl } from '../../locationUtils';

export function shareLocation(locationName: string) {
    const locationUrl = getLocationUrl(locationName);
    return shareAppUrl({
        title: locationName,
        text: `Birding location: ${locationName}`,
        url: locationUrl
    });
}
