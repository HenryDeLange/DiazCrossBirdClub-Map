import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import type { INatSpeciesCount } from './iNatTypes';

type Props = {
    mapHeight: number;
}

export function SpeciesListControl({ mapHeight }: Readonly<Props>) {
    const map = useMap();

    const [showModal, setShowModal] = useState<boolean>(false);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setShowModal((currentValue) => {
            const nextValue = !currentValue;
            if (!nextValue) {
                setData(null);
            }
            return nextValue;
        });
    };

    const [data, setData] = useState<INatSpeciesCount | null>(null);

    useEffect(() => {
        if (showModal) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();

            const bounds = map.getBounds();
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            const northEastLat = Number(northEast.lat);
            const northEastLng = Number(northEast.lng);
            const southWestLat = Number(southWest.lat);
            const southWestLng = Number(southWest.lng);

            // TODO: Handle pagination (though it's unlikely to exceed 500 species any time soon)
            fetch(`https://api.inaturalist.org/v1/observations/species_counts?captive=false&iconic_taxa=Aves&nelat=${northEastLat}&nelng=${northEastLng}&swlat=${southWestLat}&swlng=${southWestLng}&verifiable=true&per_page=500`)
                .then((response) => response.json())
                .then((data) => {
                    setData(data);
                })
                .catch((error) => {
                    console.error('Error fetching data:', error);
                });
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
    }, [showModal, mapHeight]);

    return (
        <>
            <button onClick={handleClick} title='iNaturalist Species List'>
                <img alt='inat-logo' src='./inat-logo.png' width={'40rem'} />
            </button>
            {showModal && (
                <div style={{ zIndex: 999999999 }}>
                    <div>
                        <div>
                            <div ref={modalHeadingRef}>
                                <div>
                                    <p>
                                        iNaturalist Species List
                                        {data &&
                                            <span> ({data.total_results})</span>
                                        }
                                    </p>
                                    <a
                                        href={`https://www.inaturalist.org/observations?captive=false&subview=map&view=species&iconic_taxa=Aves&nelat=${Number(map.getBounds().getNorthEast().lat)}&nelng=${Number(map.getBounds().getNorthEast().lng)}&swlat=${Number(map.getBounds().getSouthWest().lat)}&swlng=${Number(map.getBounds().getSouthWest().lng)}`}
                                        target='_blank'
                                    >
                                        View on iNaturalist
                                    </a>
                                </div>
                                <div>
                                    <button
                                        onClick={handleClick}
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>
                            <div style={{ maxHeight: height }}>
                                {!data &&
                                    <div>
                                        <div>
                                            <div></div>
                                            <div></div>
                                        </div>
                                    </div>
                                }
                                {data &&
                                    <article>
                                        {data.results.map((speciesCount, index) => (
                                            <div key={`${index}_${speciesCount.taxon.name}`}>
                                                <img
                                                    alt={speciesCount.taxon.name}
                                                    src={speciesCount.taxon.default_photo.medium_url}
                                                />
                                                <div>
                                                    {speciesCount.taxon.preferred_common_name}
                                                </div>
                                                <div>
                                                    <i>{speciesCount.taxon.name}</i>
                                                </div>
                                            </div>
                                        ))}
                                    </article>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
