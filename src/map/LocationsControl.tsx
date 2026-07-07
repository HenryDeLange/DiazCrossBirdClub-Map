import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Info, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import type { FeatureProps } from './geojson/types';

type Props = {
    mapHeight: number;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export function LocationsControl({ mapHeight, isOpen, onToggle, onClose }: Readonly<Props>) {
    const map = useMap();
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setIsClosing(false);
        }
        else if (isMounted) {
            setIsClosing(true);
            const timeout = window.setTimeout(() => {
                setIsMounted(false);
                setIsClosing(false);
            }, 240);
            return () => window.clearTimeout(timeout);
        }
    }, [isOpen, isMounted]);

    useEffect(() => {
        if (isOpen) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
        }
        else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        }
    }, [isOpen, map]);

    const drawerHeight = Math.min(mapHeight * 0.82, 780);
    const showDrawer = isMounted || isOpen;

    const tabs = [
        { label: 'Outings', content: <FeatureDetails geojson={outings} /> },
        { label: 'Spots', content: <FeatureDetails geojson={spots} /> },
        { label: 'Paths', content: <FeatureDetails geojson={paths} /> },
        { label: 'Points', content: <FeatureDetails geojson={points} /> }
    ];

    return (
        <>
            <div className='control-group locations-group'>
                <button className='control-button locations-button' onClick={(event) => { event.stopPropagation(); onToggle(); }} title='Birding Locations' type='button'>
                    <Info className='button-icon' />
                </button>
            </div>
            {showDrawer && (
                <div className={`drawer-backdrop ${isOpen ? 'drawer-backdrop-open' : 'drawer-backdrop-closing'}`} onClick={onClose}>
                    <div
                        className={`drawer-panel ${isOpen ? 'drawer-open' : 'drawer-closed'} ${isClosing ? 'drawer-closing' : ''}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ height: drawerHeight }}
                    >
                        <div className='drawer-header'>
                            <div>
                                <div className='drawer-label'>GeoJSON locations</div>
                                <div className='drawer-title'>Birding location details</div>
                            </div>
                            <button type='button' className='drawer-close drawer-close-large' onClick={onClose} aria-label='Close drawer'>
                                <X className='drawer-close-icon' />
                            </button>
                        </div>
                        <Tabs height={drawerHeight - 104} tabs={tabs} />
                    </div>
                </div>
            )}
        </>
    );
}

type TabProps = {
    tabs: {
        label: string;
        content: ReactNode;
    }[];
    height: number;
}

function Tabs({ tabs, height }: TabProps) {
    const [activeTab, setActiveTab] = useState(tabs[0].label);
    return (
        <>
            <div className='drawer-tabs'>
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        type='button'
                        className={`drawer-tab ${activeTab === tab.label ? 'drawer-tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.label)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className='drawer-content' style={{ height }}>
                {tabs.map((tab) => activeTab === tab.label && (
                    <div key={tab.label}>{tab.content}</div>
                ))}
            </div>
        </>
    );
};

type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
}

function FeatureDetails({ geojson }: FeatureDetailsProps) {
    return (
        <>
            {geojson.map((geojsonObject, outingIndex) => (
                <div key={outingIndex} className='location-list'>
                    {geojsonObject.features.map((feature: Feature<Geometry, FeatureProps>, featureIndex: number) => {
                        if (!feature.properties.name) {
                            return null;
                        }

                        return (
                            <div key={`${featureIndex}_${feature.properties.name}_${feature.id ?? 'unknown'}`} className='location-card'>
                                <div className='location-card-title'>{feature.properties.name}</div>
                                {feature.properties.description && (
                                    <div className='location-card-description'>{feature.properties.description}</div>
                                )}
                                <div className='location-card-links'>
                                    {feature.properties.linkMap && (
                                        <a href={feature.properties.linkMap} target='_blank' rel='noreferrer'>Map pin</a>
                                    )}
                                    {feature.properties.linkDocument && (
                                        <a href={feature.properties.linkDocument} target='_blank' rel='noreferrer'>Document</a>
                                    )}
                                    {feature.properties.linkWeb && (
                                        <a href={feature.properties.linkWeb} target='_blank' rel='noreferrer'>Website</a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </>
    );
}
