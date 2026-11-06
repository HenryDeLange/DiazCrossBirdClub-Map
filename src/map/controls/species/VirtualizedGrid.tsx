import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

type VirtualizedGridProps<T> = {
    items: readonly T[];
    scrollElementRef: RefObject<HTMLElement | null>;
    layout: 'species' | 'photos';
    className: string;
    rowClassName: string;
    minItemWidth: number;
    gap: number;
    estimateRowSize?: number;
    getItemKey: (item: T, index: number) => string | number;
    renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualizedGrid<T>({
    items,
    scrollElementRef,
    layout,
    className,
    rowClassName,
    minItemWidth,
    gap,
    estimateRowSize,
    getItemKey,
    renderItem
}: Readonly<VirtualizedGridProps<T>>) {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const updateSize = () => {
            setContainerWidth(canvas.clientWidth);
            setViewportWidth(window.innerWidth);
        };
        const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateSize);
        resizeObserver?.observe(canvas);
        window.addEventListener('resize', updateSize);
        updateSize();

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    const columns = getColumnCount(layout, containerWidth, viewportWidth, minItemWidth, gap);
    const rowCount = Math.ceil(items.length / columns);
    const rowGap = layout === 'species' && viewportWidth > 0 && viewportWidth <= 820 ? 12 : gap;
    // TanStack Virtual returns a mutable API object that React Compiler cannot memoize safely.
    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: () => estimateRowSize
            ?? Math.max(minItemWidth, (containerWidth - rowGap * (columns - 1)) / columns) + rowGap,
        overscan: 1
    });

    useEffect(() => {
        rowVirtualizer.measure();
    }, [columns, rowVirtualizer]);

    return (
        <div ref={canvasRef} className={className} style={{ height: rowVirtualizer.getTotalSize() }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const firstItemIndex = virtualRow.index * columns;
                const rowItems = items.slice(firstItemIndex, firstItemIndex + columns);
                return (
                    <div
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className={rowClassName}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            display: 'grid',
                            width: '100%',
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            gap: rowGap,
                            transform: `translateY(${virtualRow.start}px)`
                        }}
                    >
                        {rowItems.map((item, index) => {
                            const itemIndex = firstItemIndex + index;
                            return <div key={getItemKey(item, itemIndex)}>{renderItem(item, itemIndex)}</div>;
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function getColumnCount(
    layout: 'species' | 'photos',
    containerWidth: number,
    viewportWidth: number,
    minItemWidth: number,
    gap: number
): number {
    if (layout === 'species') {
        if (viewportWidth <= 219) {
            return 1;
        }
        if (viewportWidth <= 820) {
            return 2;
        }
    }

    return Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
}
