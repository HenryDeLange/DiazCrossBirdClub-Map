import { useCallback, useState, type MouseEventHandler } from 'react';

export function Logo() {
    const [expanded, setExpanded] = useState<boolean>(false);
    const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>((event) => {
        // TODO: Double-clicks still carry through to the map for some reason
        event.stopPropagation();
        setExpanded(!expanded);
    }, [expanded]);
    return (
        <button onClick={handleClick}>
            <img alt='dcbc-logo' src='./logo.png' width={'75rem'} />
            {expanded &&
                <a href='https://sites.google.com/site/diazcrossbirdclub/home' target='_blank'>
                    <div>
                        Diaz Cross
                    </div>
                    <div>
                        Bird Club
                    </div>
                </a>
            }
        </button>
    );
}
