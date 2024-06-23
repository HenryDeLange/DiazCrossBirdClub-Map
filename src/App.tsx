import LoadingOrError from 'LoadingOrError';
import type { ReactElement } from 'react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const BirdingMap = lazy(async () => import('map/BirdingMap'));

export default function App(): ReactElement {
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingOrError />}>
                <Routes>
                    <Route path='/' element={<BirdingMap />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    ); 
}
