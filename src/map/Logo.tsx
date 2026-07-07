import type { MouseEvent } from 'react';

export function Logo() {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        event.stopPropagation();
    };

    return (
        <div className='logo-card'>
            <a
                className='logo-button'
                href='https://www.diazcrossbirdclub.co.za'
                target='_blank'
                rel='noreferrer'
                onClick={handleClick}
            >
                <img className='logo-image' alt='DCBC logo' src='/LOGO.png' />
                <div className='logo-text'>
                    <div className='logo-brand'>Diaz Cross</div>
                    <div className='logo-subtitle'>Bird Club</div>
                </div>
            </a>
        </div>
    );
}
