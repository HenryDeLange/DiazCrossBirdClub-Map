import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { INatSpeciesCount } from './iNatTypes';

export function SpeciesListControl() {
    const map = useMap();

    const [showModal, setShowModal] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
        event.stopPropagation();
        setShowModal(!showModal);
    }, [showModal]);

    const [data, setData] = useState<INatSpeciesCount | null>(null);

    useEffect(() => {
        if (showModal) {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
            fetch(`https://api.inaturalist.org/v1/observations/species_counts?captive=false&iconic_taxa=Aves&nelat=${map.getBounds().getNorthEast().lat}&nelng=${map.getBounds().getNorthEast().lng}&swlat=${map.getBounds().getSouthWest().lat}&swlng=${map.getBounds().getSouthWest().lng}&verifiable=true&per_page=500`)
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
            setData(null);
        }
    }, [showModal, map]);

    return (
        <>
            <button className='inat-button' onClick={handleClick}>
                <img alt='inat-logo' src='./inat-logo.png' width={'40rem'} className='inat-button-image' />
            </button>
            {showModal && (
                <div className='fixed inset-0 bg-gray-900 bg-opacity-75' style={{ zIndex: 999999999 }}>
                    <div className='modal-container w-full h-full px-4 pt-4 '>
                        <div className='bg-white rounded-t-lg p-4 text-black w-full h-full max-h-full'>
                            <div className='flex justify-between items-center pb-2'>
                                <div>
                                    <p className='text-2xl font-bold'>
                                        iNaturalist Species List
                                        {data &&
                                            <span> ({data.total_results})</span>
                                        }
                                    </p>
                                    <a className='text-lg'
                                        href={`https://www.inaturalist.org/observations?captive=false&subview=map&view=species&iconic_taxa=Aves&nelat=${map.getBounds().getNorthEast().lat}&nelng=${map.getBounds().getNorthEast().lng}&swlat=${map.getBounds().getSouthWest().lat}&swlng=${map.getBounds().getSouthWest().lng}`}
                                        target='_blank'
                                    >
                                        View on iNaturalist
                                    </a>
                                </div>
                                <div className='flex justify-end pt-2'>
                                    <button className='modal-close px-4 bg-green-600 p-3 rounded-lg text-black hover:bg-green-500 text-lg'
                                        onClick={handleClick}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                            <div className={`modal-content mt-2 max-h-full ${data ? 'overflow-y-auto' : ''}`}>
                                <div>
                                    {!data &&
                                        <div className='flex flex-row justify-center gap-2'>
                                            <div className='relative h-8 w-8'>
                                                <div className='absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-tr from-lime-300 to-green-500 animate-spin'></div>
                                                <div className='absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-white'></div>
                                            </div>
                                            <div className='flex items-center text-lg'>
                                                Loading...
                                            </div>
                                        </div>
                                    }
                                    {data &&
                                        <div className='max-h-full overflow-y-auto pb-20'>
                                            <article className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-6 gap-x-6'>
                                                {data.results.map((speciesCount, index) => (
                                                    <div key={`${index}_${speciesCount.taxon.name}`}>
                                                        <img
                                                            alt={speciesCount.taxon.name}
                                                            src={speciesCount.taxon.default_photo.medium_url}
                                                            className='object-cover h-60 w-60'
                                                        />
                                                        <div className='text-sm font-semibold'>
                                                            {speciesCount.taxon.preferred_common_name}
                                                        </div>
                                                        <div className='text-sm'>
                                                            <i>{speciesCount.taxon.name}</i>
                                                        </div>
                                                    </div>
                                                ))}
                                            </article>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
