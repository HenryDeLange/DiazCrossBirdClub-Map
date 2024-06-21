export type LineStyle = {
    stroke?: string;
    "stroke-width"?: number;
    "stroke-opacity"?: number;
}

export type PolyStyle = LineStyle & {
    fill?: string;
    "fill-opacity"?: number;
};

export type Info = {
    name: string;
    description: string;
    location?: 'private property' | 'public property' | 'trail' | 'water body';
    road?: 'access' | 'birding';
}

export type FeatureStyle = Info & LineStyle & PolyStyle;
