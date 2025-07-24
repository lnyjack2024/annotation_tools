export interface Styles {
  fill_color?: string;
}

export enum StyleNames {
  FILL_COLOR = "fill_color",
}

export enum AttrType {
  SEGMENT_ATTR = "segment_attr",
  LINE_ATTR = "line_attr",
}

export interface Group extends Styles {
  key?: string;
  attributes: any;
}
