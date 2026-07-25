import { Suspense } from 'react';
import { LoadingOrError } from './LoadingOrError';
import AstraPage from './astra/AstraPage';
import BirdingMap from './map/BirdingMap';
import { isAstraPath } from './map/locationUtils';

export default function App() {
    return (
        <Suspense fallback={<LoadingOrError />}>
            {isAstraPath(window.location.pathname) ? <AstraPage /> : <BirdingMap />}
        </Suspense>
    )
}
