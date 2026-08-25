import { Search, X } from 'lucide-react';
import styles from './DrawerSearchField.module.css';

type Props = {
    ariaLabel: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    variant?: 'filters' | 'panel';
}

export function DrawerSearchField({ ariaLabel, placeholder, value, onChange, variant }: Readonly<Props>) {
    return (
        <div className={`${styles.searchRow} ${variant ? styles[variant] : ''}`}>
            <Search className={styles.searchIcon} />
            <input
                aria-label={ariaLabel}
                className={styles.searchInput}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type='search'
                value={value}
            />
            <button
                aria-hidden={!value}
                aria-label='Clear search'
                className={`${styles.searchClear} ${!value ? styles.searchClearHidden : ''}`}
                disabled={!value}
                onClick={() => onChange('')}
                tabIndex={value ? 0 : -1}
                title='Clear search'
                type='button'
            >
                <X className={styles.searchClearIcon} />
            </button>
        </div>
    );
}