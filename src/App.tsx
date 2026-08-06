import { Suspense } from 'react';
import { LoadingOrError } from './LoadingOrError';
import { isAstraPath, isTidesPath } from './appRouting';
import AstraPage from './calculations/astra/AstraPage';
import TidesPage from './calculations/tides/TidesPage';
import BirdingMap from './map/BirdingMap';

export default function App() {
    return (
        <Suspense fallback={<LoadingOrError />}>
            {isAstraPath(window.location.pathname) ? <AstraPage />
                : isTidesPath(window.location.pathname) ? <TidesPage />
                    : <BirdingMap />}
        </Suspense>
    );
}
