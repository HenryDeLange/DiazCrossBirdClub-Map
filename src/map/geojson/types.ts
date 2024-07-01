type LineStyle = {
    stroke?: string;
    'stroke-width'?: number;
    'stroke-opacity'?: number;
}

type PolyStyle = LineStyle & {
    fill?: string;
    'fill-opacity'?: number;
};

type Info = {
    name: string;
    description?: string;
    road?: 'access' | 'birding' | 'loop';
    document?: string;
    pin?: string;
    category?: 'spot';
}

export type FeatureProps = Info & LineStyle & PolyStyle;
