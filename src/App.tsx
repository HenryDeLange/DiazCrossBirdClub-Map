import { Suspense } from 'react';
import { LoadingOrError } from './LoadingOrError';
import BirdingMap from './map/BirdingMap';

export default function App() {
    return (
        <Suspense fallback={<LoadingOrError />}>
            <BirdingMap />
        </Suspense>
    )
}
