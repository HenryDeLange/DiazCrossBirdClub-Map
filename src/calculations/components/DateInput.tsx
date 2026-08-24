import { CalendarDays } from 'lucide-react';
import { memo } from 'react';
import styles from './DateLocationInputs.module.css';
import type { DateLocationInputsProps } from './dateLocationInputTypes';

type DateInputProps = Pick<DateLocationInputsProps, 'dateValue' | 'onDateChange' | 'idPrefix'>;

export const DateInput = memo(function DateInput({ dateValue, onDateChange, idPrefix }: Readonly<DateInputProps>) {
    return (
        <div className={`${styles.fieldSection} ${styles.dateBlock}`}>
            <div className={`${styles.sectionLabel} ${styles.dateLabel}`} title='Date'>
                <CalendarDays size={18} aria-hidden='true' />
                <span className={styles.visuallyHidden}>Date</span>
            </div>
            <input id={`${idPrefix}-date`} type='date' aria-label='Date' value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
        </div>
    );
});