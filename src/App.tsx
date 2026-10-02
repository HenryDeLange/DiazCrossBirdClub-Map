import { lazy, Suspense } from 'react';
import { LoadingOrError } from './LoadingOrError';
import { isAstraPath, isEditPath, isTidesPath } from './appRouting';
import { ThemeProvider } from './theme/ThemeProvider';

const BirdingMap = lazy(() => import('./map/BirdingMap'));
const AstraPage = lazy(() => import('./calculations/astra/AstraPage'));
const TidesPage = lazy(() => import('./calculations/tides/TidesPage'));
const EditPage = lazy(() => import('./edit/EditPage'));

export default function App() {
    return (
        <ThemeProvider>
            <Suspense fallback={<LoadingOrError />}>
                {isAstraPath(window.location.pathname) ? <AstraPage />
                    : isTidesPath(window.location.pathname) ? <TidesPage />
                        : isEditPath(window.location.pathname) ? <EditPage />
                            : <BirdingMap />}
            </Suspense>
        </ThemeProvider>
    );
}
