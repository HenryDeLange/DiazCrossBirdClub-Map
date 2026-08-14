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
    allContent: (searchQuery: string) => ReactNode;
    initialSearchQuery?: string;
    initialTab?: LocationTabName;
    onSearchCleared: () => void;
}

type LocationTabSelection = LocationTabName | 'All';

const locationTabNames: LocationTabName[] = ['Outings', 'Spots', 'Paths', 'Points'];

export function LocationTabs({ tabs, allContent, initialSearchQuery, initialTab, onSearchCleared }: Readonly<LocationTabsProps>) {
    const [activeTab, setActiveTab] = useState<LocationTabSelection>(
        initialTab && locationTabNames.includes(initialTab) ? initialTab : 'All'
    );
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
    const [debouncedSearchQuery] = useDebounceValue(searchQuery, 300);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const previousSearchQueryRef = useRef(searchQuery);

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
            <div className='drawer-location-filters'>
                <div className='drawer-tabs'>
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            type='button'
                            className={`drawer-tab ${activeTab === tab.label ? 'drawer-tab-active' : ''}`}
                            aria-pressed={activeTab === tab.label}
                            onClick={() => setActiveTab((current) => current === tab.label ? 'All' : tab.label)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className='drawer-tab-select-row'>
                    <select
                        aria-label='Choose location type'
                        className='drawer-tab-select'
                        onChange={(event) => setActiveTab(event.target.value as LocationTabSelection)}
                        value={activeTab}
                    >
                        <option value='All'>All</option>
                        {tabs.map((tab) => (
                            <option key={tab.label} value={tab.label}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                </div>
                <DrawerSearchField
                    ariaLabel='Search locations'
                    onChange={setSearchQuery}
                    placeholder='Search locations'
                    value={searchQuery}
                />
            </div>
            <div className='drawer-content' ref={contentRef}>
                {activeTab === 'All'
                    ? allContent(debouncedSearchQuery)
                    : tabs.map((tab) => activeTab === tab.label && (
                        <div key={tab.label}>{tab.content(debouncedSearchQuery)}</div>
                    ))}
            </div>
        </>
    );
}
