import type { FeatureCollection, Geometry } from 'geojson';
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { FaInfo } from 'react-icons/fa';
import { useMap } from 'react-leaflet';
import { outings } from './geojson/outings';
import { paths } from './geojson/paths';
import { points } from './geojson/points';
import { spots } from './geojson/spots';
import { FeatureProps } from './geojson/types';

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
                const padding = 16; // From the parent element's "p-4"
                setHeight(mapHeight - headingHeight - headingTop - padding);
            }
        };
        window.addEventListener('resize', updateHeight);
        updateHeight();
        return () => window.removeEventListener('resize', updateHeight);
    }, [showModal, modalHeadingRef.current, mapHeight]);

    const tabs = [
        { label: 'Outings', content: <FeatureDetails title='Outings' geojson={outings} /> },
        { label: 'Spots', content: <FeatureDetails title='Spots' geojson={spots} /> },
        { label: 'Paths', content: <FeatureDetails title='Paths' geojson={paths} /> },
        { label: 'Points', content: <FeatureDetails title='Points' geojson={points} /> },
      ];

    return (
        <>
            <button className='locations-button' onClick={handleClick} title='Birding Locations'>
                <FaInfo className='locations-button-image m-1' size={'2rem'} />
            </button>
            {showModal && (
                <div className='fixed inset-0 bg-gray-900 bg-opacity-75' style={{ zIndex: 999999999 }}>
                    <div className='modal-container w-full h-full px-4 pt-4'>
                        <div className='bg-white rounded-t-lg p-4 text-black w-full h-full max-h-full'>
                            <div ref={modalHeadingRef} className='flex justify-between items-center pb-2'>
                                <div>
                                    <p className='text-2xl font-bold'>
                                        Birding Locations
                                    </p>
                                </div>
                                <div className='flex justify-end pt-2'>
                                    <button className='modal-close px-4 text-white bg-green-600 p-3 rounded-lg hover:bg-green-700 text-lg'
                                        onClick={handleClick}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                            <div className='modal-content mt-2 overflow-y-auto' style={{ maxHeight: height }}>
                                <Tabs tabs={tabs} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

type TabProps = {
    label: string;
    content: React.ReactNode;
}

const Tabs: React.FC<{ tabs: TabProps[] }> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].label);
    return (
        <div>
            <div className="flex border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        className={`px-4 py-2 -mb-px border-b-2 ${activeTab === tab.label ? 'border-blue-500' : 'border-transparent'
                            }`}
                        onClick={() => setActiveTab(tab.label)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="p-4">
                {tabs.map(
                    (tab) =>
                        activeTab === tab.label && (
                            <div key={tab.label}>{tab.content}</div>
                        )
                )}
            </div>
        </div>
    );
};

type FeatureDetailsProps = {
    title: string;
    geojson: FeatureCollection<Geometry, FeatureProps>[];
}

function FeatureDetails({ title, geojson }: FeatureDetailsProps) {
    return (
        <>
            <div className='text-2xl font-bold'>
                {title}
            </div>
            {geojson.map((geojsonObject, outingIndex) => (
                <div key={outingIndex} className='text-2xl font-bold mb-8'>
                    {geojsonObject.features.map((feature, featureIndex) => {
                        if (feature.properties.description)
                            return (
                                <div key={`${featureIndex}_${feature.properties.name}_${feature.id}`}>
                                    <div className='text-xl'>
                                        {feature.properties.name}
                                    </div>
                                    <div className='text-base'>
                                        {feature.properties.description}
                                    </div>
                                </div>
                            );
                    })}
                </div>
            ))}
        </>
    );
}
