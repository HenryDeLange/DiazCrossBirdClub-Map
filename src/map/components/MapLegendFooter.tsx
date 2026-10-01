import { getEditPathname } from '../../appRouting';
import { useTheme } from '../../theme/useTheme';
import styles from './MapLegendFooter.module.css';

type MapLegendFooterProps = {
    onOpenCache: () => void;
}

export function MapLegendFooter({ onOpenCache }: Readonly<MapLegendFooterProps>) {
    const { preference, cyclePreference } = useTheme();
    const themeLabel = preference === 'system' ? 'Auto' : `${preference.slice(0, 1).toUpperCase()}${preference.slice(1)}`;

    return (
        <>
            <div className={styles.footer} role='contentinfo'>
                <div className={styles.footerLinks}>
                    <a href='https://github.com/HenryDeLange/DiazCrossBirdClub-Map' target='_blank' rel='noreferrer' title='Open the DCBC Birding Map GitHub repository'>v{VITE_APP_VERSION}</a>
                    <span aria-hidden='true'>|</span>
                    <a href='https://www.mywild.co.za' target='_blank' rel='noreferrer'>MyWild</a>
                    <span aria-hidden='true'>|</span>
                    <a href='https://www.diazcrossbirdclub.co.za' target='_blank' rel='noreferrer'>DCBC</a>
                    <span aria-hidden='true'>| Google</span>
                </div>
            </div>
            <div className={styles.footerActions} role='group' aria-label='Map actions'>
                    <a href={getEditPathname()} className={styles.action} title='Edit GeoJSON locations' aria-label='Edit GeoJSON locations'>Edit</a>
                <span aria-hidden='true'>|</span>
                    <button type='button' className={styles.action} onClick={onOpenCache} title='Clear cached app data' aria-label='Clear cached app data'>Cache</button>
                <span aria-hidden='true'>|</span>
                <button type='button' className={styles.action} onClick={cyclePreference} title={`Theme: ${themeLabel}. Select to cycle light, dark, and auto.`} aria-label={`Theme: ${themeLabel}. Select to cycle light, dark, and auto.`}>{themeLabel}</button>
            </div>
        </>
    );
}