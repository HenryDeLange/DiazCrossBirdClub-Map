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
}

type LineInfo = {
    road?: 'access' | 'birding' | 'drive';
}

type PolyInfo = {
    linkDocument?: string;
    linkMap?: string;
    linkWeb?: string;
}

type PointInfo = {
    category?: 'spot';
}

export type FeatureProps =
    BaseInfo &
    LineInfo &
    PolyInfo &
    PointInfo &
    LineStyle &
    PolyStyle;
