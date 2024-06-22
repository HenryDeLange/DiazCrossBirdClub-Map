import { MouseEventHandler, useCallback, useState } from 'react';

export function Logo() {
    const [expanded, setExpanded] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => setExpanded(!expanded), [expanded]);
    return (
        <button className='logo flex items-center' onClick={handleClick}>
            <img alt='dcbc-logo'  src='./logo.png' width={'70rem'} className='logo-image' />
            {expanded &&
                <p className='m-2'>
                    Diaz Cross Bird Club
                </p>
            }
        </button>
    );
}
