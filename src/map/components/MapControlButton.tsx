import type { ReactNode } from 'react';

type MapControlButtonProps = {
    groupClassName: string;
    buttonClassName: string;
    title: string;
    onClick: () => void;
    children: ReactNode;
}

export function MapControlButton({ groupClassName, buttonClassName, title, onClick, children }: Readonly<MapControlButtonProps>) {
    return (
        <div className={`control-group ${groupClassName}`}>
            <button
                className={`control-button ${buttonClassName}`}
                onClick={(event) => {
                    event.stopPropagation();
                    onClick();
                }}
                title={title}
                type='button'
            >
                {children}
            </button>
        </div>
    );
}
