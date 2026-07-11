import { Search } from 'lucide-react';

type Props = {
    ariaLabel: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}

export function DrawerSearchField({ ariaLabel, placeholder, value, onChange }: Readonly<Props>) {
    return (
        <div className='drawer-search-row'>
            <Search className='drawer-search-icon' />
            <input
                aria-label={ariaLabel}
                className='drawer-search-input'
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type='search'
                value={value}
            />
        </div>
    );
}