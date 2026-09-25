import type { Geometry } from 'geojson';
import type { FeatureProps } from '../map/geojson/types';
import styles from './EditPage.module.css';
import type { EditorFeature } from './geojsonValidation';

type FeaturePropertiesEditorProps = {
    canDemoteTitleToSpot: boolean;
    disabled: boolean;
    feature: EditorFeature;
    onChange: (properties: FeatureProps) => void;
}

const lineTypes = new Set<Geometry['type']>(['LineString', 'MultiLineString']);

export function FeaturePropertiesEditor({ canDemoteTitleToSpot, disabled, feature, onChange }: Readonly<FeaturePropertiesEditorProps>) {
    const geometryType = feature.geometry.type;
    const properties = feature.properties;
    const isLine = lineTypes.has(geometryType);

    const setProperty = (key: keyof FeatureProps, value: string | number | boolean) => {
        const updated: Record<string, unknown> = { ...properties };
        if (value === '') {
            delete updated[key];
        }
        else {
            updated[key] = value;
        }
        onChange(updated as FeatureProps);
    };

    return (
        <div className={styles.propertyForm}>
            <fieldset className={styles.propertyFields} disabled={disabled}>
            <label className={styles.field}>
                <span>Name <b aria-hidden='true'>*</b></span>
                <input value={properties.name ?? ''} onChange={(event) => setProperty('name', event.target.value)} maxLength={120} />
            </label>
            <label className={styles.field}>
                <span>Description</span>
                <textarea value={properties.description ?? ''} onChange={(event) => setProperty('description', event.target.value)} rows={3} maxLength={2000} />
            </label>

            {geometryType === 'Point' && (
                <label className={styles.field}>
                    <span>Category <b aria-hidden='true'>*</b></span>
                    <select value={properties.category ?? ''} onChange={(event) => setProperty('category', event.target.value)}>
                        <option value='' disabled>Select a category</option>
                        {(properties.category === 'spot' || canDemoteTitleToSpot) && <option value='spot'>Spot</option>}
                        <option value='title'>Title</option>
                    </select>
                </label>
            )}

            {geometryType === 'Point' && properties.category === 'title' && (
                <label className={styles.checkboxField}>
                    <span>Coastal location</span>
                    <input type='checkbox' role='switch' checked={properties.isCoastal ?? false} onChange={(event) => setProperty('isCoastal', event.target.checked)} />
                </label>
            )}

            {isLine && (
                <label className={styles.field}>
                    <span>Road type</span>
                    <select value={properties.road ?? ''} onChange={(event) => setProperty('road', event.target.value)}>
                        <option value=''>None</option>
                        <option value='access'>Access</option>
                        <option value='birding'>Birding</option>
                        <option value='drive'>Drive</option>
                    </select>
                </label>
            )}

            <label className={styles.field}>
                <span>Map link</span>
                <input type='url' value={properties.linkMap ?? ''} onChange={(event) => setProperty('linkMap', event.target.value)} placeholder='https://' />
            </label>
            <label className={styles.field}>
                <span>Document link</span>
                <input type='url' value={properties.linkDocument ?? ''} onChange={(event) => setProperty('linkDocument', event.target.value)} placeholder='https://' />
            </label>
            <label className={styles.field}>
                <span>Web link</span>
                <input type='url' value={properties.linkWeb ?? ''} onChange={(event) => setProperty('linkWeb', event.target.value)} placeholder='https://' />
            </label>
            </fieldset>
        </div>
    );
}