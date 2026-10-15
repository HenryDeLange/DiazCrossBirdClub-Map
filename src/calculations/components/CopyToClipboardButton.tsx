import { Clipboard, ClipboardCheck, ClipboardList } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type CopyToClipboardButtonProps = {
    text: string | null;
    textRef?: Readonly<{ current: string | null }>;
    enabled?: boolean;
    idleIcon?: 'clipboard' | 'list';
    className: string;
    copyLabel: string;
    copiedLabel: string;
    failedLabel: string;
}

export function CopyToClipboardButton({ text, textRef, enabled, idleIcon = 'clipboard', className, copyLabel, copiedLabel, failedLabel }: Readonly<CopyToClipboardButtonProps>) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
    const timeoutId = useRef<number | null>(null);
    const label = status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : copyLabel;
    const isEnabled = enabled ?? text !== null;
    const IdleIcon = idleIcon === 'list' ? ClipboardList : Clipboard;

    useEffect(() => () => {
        if (timeoutId.current !== null) {
            window.clearTimeout(timeoutId.current);
        }
    }, []);

    const handleCopy = async () => {
        const currentText = textRef?.current ?? text;
        if (!currentText) {
            return;
        }

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard access is unavailable');
            }

            await navigator.clipboard.writeText(currentText);
            setStatus('copied');
        } catch {
            setStatus('failed');
        }

        if (timeoutId.current !== null) {
            window.clearTimeout(timeoutId.current);
        }
        timeoutId.current = window.setTimeout(() => {
            setStatus('idle');
            timeoutId.current = null;
        }, 1800);
    };

    return (
        <button type='button' className={className} onClick={() => void handleCopy()} disabled={!isEnabled} aria-label={label} title={label}>
            {status === 'copied' ? <ClipboardCheck size={18} aria-hidden='true' /> : <IdleIcon size={18} aria-hidden='true' />}
        </button>
    );
}