type LineStyle = {
    stroke?: string;
    'stroke-width'?: number;
    'stroke-opacity'?: number;
}

type PolyStyle = LineStyle & {
    fill?: string;
    'fill-opacity'?: number;
};

type BaseInfo = {
    name: string;
    description?: string;
    linkDocument?: string;
    linkMap?: string;
    linkWeb?: string;
}

type LineInfo = {
    road?: 'access' | 'birding' | 'drive';
}

type PointInfo = {
    category?: 'spot' | 'title';
}

export type FeatureProps =
    BaseInfo &
    LineInfo &
    PointInfo &
    LineStyle &
    PolyStyle;
