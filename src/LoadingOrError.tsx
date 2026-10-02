import type { ReactElement } from 'react';
import styles from './LoadingOrError.module.css';

type Props = {
    error?: Error;
}

export function LoadingOrError({ error }: Props): ReactElement {
    return (
        <main className={styles.loadingScreen}>
            <div className={styles.loadingContent} role={error ? undefined : 'status'} aria-live={error ? undefined : 'polite'}>
                <img className={styles.logo} src={`${import.meta.env.BASE_URL}LOGO.jpg`} alt='Diaz Cross Bird Club' />
                <h1 className={styles.message}>
                    {error ? error.message : <>
                        Loading
                        <span className={styles.loadingDots} aria-hidden='true'>
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                        </span>
                    </>}
                </h1>
            </div>
        </main>
    );
}
