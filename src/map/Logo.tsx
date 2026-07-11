import { useState } from 'react';

export function Logo() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className='logo-card'>
            <div className={`logo-button ${isExpanded ? 'logo-button-expanded' : ''}`}>
                <button
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse Diaz Cross Bird Club label' : 'Expand Diaz Cross Bird Club label'}
                    className='logo-toggle'
                    onClick={(event) => {
                        event.stopPropagation();
                        setIsExpanded((current) => !current);
                    }}
                    type='button'
                >
                    <img className='logo-image' alt='DCBC logo' src='/LOGO.jpg' />
                </button>
                <a
                    className='logo-text'
                    href='https://www.diazcrossbirdclub.co.za'
                    target='_blank'
                    rel='noreferrer'
                    onClick={(event) => event.stopPropagation()}
                >
                    <div>Diaz Cross</div>
                    <div>Bird Club</div>
                </a>
            </div>
        </div>
    );
}
