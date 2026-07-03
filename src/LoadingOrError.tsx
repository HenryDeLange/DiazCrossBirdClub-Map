import type { ReactElement } from 'react';

type Props = {
    error?: Error;
}

export function LoadingOrError({ error }: Props): ReactElement {
    return (
        <div>
            <h1>
                {error ? error.message : 'Loading...'}
            </h1>
        </div>
    );
}
