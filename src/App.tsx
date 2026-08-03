import { Suspense } from 'react';
import { LoadingOrError } from './LoadingOrError';
import { isAstraPath } from './appRouting';
import AstraPage from './astra/AstraPage';
import BirdingMap from './map/BirdingMap';

export default function App() {
    return (
        <Suspense fallback={<LoadingOrError />}>
            {isAstraPath(window.location.pathname) ? <AstraPage /> : <BirdingMap />}
        </Suspense>
    );
}
