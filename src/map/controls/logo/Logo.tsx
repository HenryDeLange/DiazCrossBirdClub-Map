import { useState } from 'react';
import styles from './Logo.module.css';

export function Logo() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={styles.logoCard}>
            <div className={`${styles.logoButton} ${isExpanded ? styles.logoButtonExpanded : ''}`}>
                <button
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse Diaz Cross Bird Club label' : 'Expand Diaz Cross Bird Club label'}
                    className={styles.logoToggle}
                    onClick={(event) => {
                        event.stopPropagation();
                        setIsExpanded((current) => !current);
                    }}
                    type='button'
                >
                    <img className={styles.logoImage} alt='DCBC logo' src='/LOGO.jpg' />
                </button>
                <a
                    className={styles.logoText}
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
