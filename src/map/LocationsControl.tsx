import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type MouseEventHandler, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import type { FeatureProps } from './geojson/types';

type Props = {
    mapHeight: number;
}

export function LocationsControl({ mapHeight }: Readonly<Props>) {
    const map = useMap();

    const [showModal, setShowModal] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
        event.stopPropagation();
        setShowModal(!showModal);
    }, [showModal]);

    useEffect(() => {
        if (showModal) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
        }
        else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
        }
    }, [showModal, map]);

    const modalHeadingRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(mapHeight);

    useEffect(() => {
        const updateHeight = () => {
            if (showModal && modalHeadingRef.current) {
                const headingHeight = modalHeadingRef.current.getBoundingClientRect().height;
                const headingTop = modalHeadingRef.current.getBoundingClientRect().top;
                const padding = 16; // From the parent element's 'p-4'
                setHeight(mapHeight - headingHeight - headingTop - padding);
            }
        };
        window.addEventListener('resize', updateHeight);
        updateHeight();
        return () => window.removeEventListener('resize', updateHeight);
    }, [showModal, mapHeight]);

    const tabs = [
        { label: 'Outings', content: <FeatureDetails geojson={outings} /> },
        { label: 'Spots', content: <FeatureDetails geojson={spots} /> },
        { label: 'Paths', content: <FeatureDetails geojson={paths} /> },
        { label: 'Points', content: <FeatureDetails geojson={points} /> }
    ];

    return (
        <>
            <button onClick={handleClick} title='Birding Locations'>
                <Info size={'2rem'} />
            </button>
            {showModal && (
                <div style={{ zIndex: 999999999 }}>
                    <div>
                        <div>
                            <div ref={modalHeadingRef}>
                                <div>
                                    <p>
                                        Birding Locations
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={handleClick}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                            <Tabs height={height} tabs={tabs} />
                        </div>
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
        <div>
            <div>
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.label)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div style={{ maxHeight: height }}>
                <div>
                    {tabs.map((tab) => activeTab === tab.label && (
                        <div key={tab.label}>{tab.content}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

type FeatureDetailsProps = {
    geojson: FeatureCollection<Geometry, FeatureProps>[];
}

function FeatureDetails({ geojson }: FeatureDetailsProps) {
    return (
        <>
            {geojson.map((geojsonObject, outingIndex) => (
                <div key={outingIndex}>
                    {geojsonObject.features.map((feature: Feature<Geometry, FeatureProps>, featureIndex: number) => {
                        if (feature.properties.description)
                            return (
                                <div key={`${featureIndex}_${feature.properties.name ?? 'feature'}_${feature.id ?? 'unknown'}`}>
                                    <div>
                                        {feature.properties.name}
                                    </div>
                                    <div>
                                        {feature.properties.description}
                                    </div>
                                    {feature.properties.linkMap &&
                                        <a href={feature.properties.linkMap} target='_blank'>Map Pin</a>
                                    }
                                    {feature.properties.linkMap && feature.properties.linkDocument &&
                                        <span> | </span>
                                    }
                                    {feature.properties.linkDocument &&
                                        <a href={feature.properties.linkDocument} target='_blank'>Document</a>
                                    }
                                    {((feature.properties.linkMap && feature.properties.linkWeb) || (feature.properties.linkDocument && feature.properties.linkWeb)) &&
                                        <span> | </span>
                                    }
                                    {feature.properties.linkWeb &&
                                        <a href={feature.properties.linkWeb} target='_blank'>Website</a>
                                    }
                                </div>
                            );
                    })}
                </div>
            ))}
        </>
    );
}
