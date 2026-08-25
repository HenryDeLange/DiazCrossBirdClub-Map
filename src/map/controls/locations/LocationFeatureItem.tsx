import { MapPinSearch } from 'lucide-react';
import { memo } from 'react';
import { useMap } from 'react-leaflet';
import { focusLocationGroup } from '../../locationUtils';
import styles from './LocationFeatureDetails.module.css';
import { getFeatureLink } from './locationFeatureUtils';
import type { FeatureGroup } from './types';

type LocationFeatureItemProps = {
    item: FeatureGroup['items'][number];
    onClose: () => void;
}

export const LocationFeatureItem = memo(function LocationFeatureItem({ item, onClose }: Readonly<LocationFeatureItemProps>) {
    const map = useMap();
    const { feature } = item;
    const name = feature.properties.name;

    if (!name) {
        return null;
    }

    const linkMap = getFeatureLink(feature, 'map');
    const linkDocument = getFeatureLink(feature, 'document');
    const linkWeb = getFeatureLink(feature, 'web');

    return (
        <li className={styles.groupItem}>
            <div className={styles.groupItemMain}>
                <div className={styles.groupItemTitle}>{name}</div>
                {feature.properties.description && (
                    <div className={styles.groupItemDescription}>{feature.properties.description}</div>
                )}
                <div className={styles.cardLinks}>
                    {linkWeb && (
                        <a href={linkWeb} target='_blank' rel='noreferrer'>Website</a>
                    )}
                    {linkMap && (
                        <a href={linkMap} target='_blank' rel='noreferrer'>Google Maps</a>
                    )}
                    {linkDocument && (
                        <a href={linkDocument} target='_blank' rel='noreferrer'>DCBC Doc</a>
                    )}
                </div>
            </div>
            <div>
                <button
                    type='button'
                    className={styles.cardNav}
                    onClick={() => {
                        focusLocationGroup(map, feature, []);
                        onClose();
                    }}
                    aria-label={`Navigate to ${name}`}
                    title={`Navigate to ${name}`}
                >
                    <MapPinSearch className={styles.cardNavIcon} />
                </button>
            </div>
        </li>
    );
});
