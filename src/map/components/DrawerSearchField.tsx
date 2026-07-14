import { Search, X } from 'lucide-react';
import styles from './DrawerSearchField.module.css';

type Props = {
    ariaLabel: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

export function DrawerSearchField({ ariaLabel, placeholder, value, onChange }: Readonly<Props>) {
    return (
        <div className={styles.searchRow}>
            <Search className={styles.searchIcon} />
            <input
                aria-label={ariaLabel}
                className={styles.searchInput}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type='search'
                value={value}
            />
            {value && (
                <button
                    aria-label='Clear search'
                    className={styles.searchClear}
                    onClick={() => onChange('')}
                    title='Clear search'
                    type='button'
                >
                    <X className={styles.searchClearIcon} />
                </button>
            )}
        </div>
    );
}