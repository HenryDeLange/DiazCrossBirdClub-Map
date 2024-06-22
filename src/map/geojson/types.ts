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
    road?: 'access' | 'birding';
    document?: string;
    pin?: string;
}

export type FeatureProps = Info & LineStyle & PolyStyle;
