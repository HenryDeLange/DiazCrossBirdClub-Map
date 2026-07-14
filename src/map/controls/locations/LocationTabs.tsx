import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { DrawerSearchField } from '../../components/DrawerSearchField';
import type { LocationTabName } from '../../locationUtils';

type LocationTabsProps = {
    tabs: {
        label: LocationTabName;
        content: (searchQuery: string) => ReactNode;
    }[];
    height: number;
    initialSearchQuery?: string;
    initialTab?: LocationTabName;
    onSearchCleared: () => void;
}

const locationTabNames: LocationTabName[] = ['Outings', 'Spots', 'Paths', 'Points'];

export function LocationTabs({ tabs, height, initialSearchQuery, initialTab, onSearchCleared }: Readonly<LocationTabsProps>) {
    const [activeTab, setActiveTab] = useState<LocationTabName>(
        initialTab && locationTabNames.includes(initialTab) ? initialTab : tabs[0].label
    );
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
    const [debouncedSearchQuery] = useDebounceValue(searchQuery, 180);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(max-width: 820px)').matches : false);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const previousSearchQueryRef = useRef(searchQuery);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(max-width: 820px)');
        const updateLayout = () => setIsMobile(mediaQuery.matches);

        updateLayout();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updateLayout);
            return () => mediaQuery.removeEventListener('change', updateLayout);
        }

        mediaQuery.addListener(updateLayout);
        return () => mediaQuery.removeListener(updateLayout);
    }, []);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeTab, debouncedSearchQuery]);

    useEffect(() => {
        if (previousSearchQueryRef.current.trim() && !searchQuery.trim()) {
            onSearchCleared();
        }

        previousSearchQueryRef.current = searchQuery;
    }, [onSearchCleared, searchQuery]);

    return (
        <>
            {isMobile ? (
                <div className='drawer-tab-select-row'>
                    <select
                        aria-label='Choose location type'
                        className='drawer-tab-select'
                        onChange={(event) => setActiveTab(event.target.value as LocationTabName)}
                        value={activeTab}
                    >
                        {tabs.map((tab) => (
                            <option key={tab.label} value={tab.label}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className='drawer-tabs'>
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            type='button'
                            className={`drawer-tab ${activeTab === tab.label ? 'drawer-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.label)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
            <DrawerSearchField
                ariaLabel='Search locations'
                onChange={setSearchQuery}
                placeholder='Search locations'
                value={searchQuery}
            />
            <div className='drawer-content' ref={contentRef} style={{ height }}>
                {tabs.map((tab) => activeTab === tab.label && (
                    <div key={tab.label}>{tab.content(debouncedSearchQuery)}</div>
                ))}
            </div>
        </>
    );
}
