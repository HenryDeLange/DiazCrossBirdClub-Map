import { MouseEventHandler, useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';

export function SpeciesListControl() {
    const map = useMap();
    const [showModal, setShowModal] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => setShowModal(!showModal), [showModal]);
    return (
        <>
            <button className='inat-button' onClick={handleClick}>
                <img alt='inat-logo' src='./inat-logo.png' width={'40rem'} className='inat-button-image' />
            </button>
            {showModal &&
                <div className='z-50' style={{ zIndex: 999999999, position: 'absolute' }}>
                    <div className='fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75'>
                        <div className='modal-container w-full h-full p-4'>
                            <div className='modal-content bg-white rounded-lg p-4 text-black'>
                                <div className='flex justify-between items-center pb-2'>
                                    <p className='text-2xl font-bold'>iNaturalist Species List</p>
                                </div>
                                <p className=' text-black'>Render species grid here...</p>
                                <div className='flex justify-end pt-2'>
                                    <button
                                        className='modal-close px-4 bg-green-600 p-3 rounded-lg text-black hover:bg-green-500'
                                        onClick={handleClick}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}
