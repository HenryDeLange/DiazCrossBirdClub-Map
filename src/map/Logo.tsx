import { MouseEventHandler, useCallback, useState } from 'react';

export function Logo() {
    const [expanded, setExpanded] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
        // TODO: Double-clicks still carry through to the map for some reason
        event.stopPropagation();
        setExpanded(!expanded);
    }, [expanded]);
    return (
        <button className='logo flex items-center' onClick={handleClick}>
            <img alt='dcbc-logo' src='./logo.png' width={'75rem'} className='logo-image' />
            {expanded &&
                <div className='m-2'>
                    <div className='text-lg'>
                        Diaz Cross
                    </div>
                    <div className='text-lg'>
                        Bird Club
                    </div>
                </div>
            }
        </button>
    );
}
