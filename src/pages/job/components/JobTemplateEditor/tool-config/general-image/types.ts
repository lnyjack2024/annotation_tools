export interface GeneralImageOntology {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color?: string;
  label_config?: string;
  children?: GeneralImageOntologyChild[];
  multiple: boolean;
}

export interface GeneralImageOntologyChild {
  key?: string;
  name: string;
  display_color?: string;
  count?: number | null;
  min_count?: number | null;
  max_count?: number | null;
  label_config?: string;
  label_config_point?: string;
  label_config_groups?: Group[];
  label_config_point_groups?: Group[];
  // legacy tool config
  type?: string;
  edges?: number | null;
  // current tool config
  tools?: ({
    type: string;
    edges?: number | null;
    models?: boolean;
  } & Styles)[];
}

export interface Styles {
  fill_color?: string;
  point_color?: string;
  points_color?: string[];
  point_type?: string;
  points_type?: string[];
  edge_color?: string;
  edges_color?: string[];
  edge_type?: string;
  edges_type?: string[];
  edge_bold?: boolean;
  edges_bold?: boolean[];
}

export enum StyleNames {
  POINTS_COLOR = 'points_color',
  POINTS_TYPE = 'points_type',
  EDGES_COLOR = 'edges_color',
  EDGES_TYPE = 'edges_type',
  FILL_COLOR = 'fill_color',
  POINT_COLOR = 'point_color',
  POINT_TYPE = 'point_type',
  EDGE_COLOR = 'edge_color',
  EDGE_TYPE = 'edge_type',
  EDGE_BOLD = 'edge_bold',
}

export interface Group extends Styles {
  key?: string;
  attributes: any;
}

export enum Tool {
  RECTANGLE = 'rectangle',
  FOUR_DOTS_RECTANGLE = 'four-dots-rectangle',
  CENTERLINE_RECTANGLE = 'centerline-rectangle',
  ELLIPSE = 'ellipse',
  POLYGON = 'polygon',
  LINE = 'line',
  DOT = 'dot',
  CUBOID = 'cuboid',
  LSHAPE = 'l-shape',
  OCR = 'ocr',
  OCR_POLYGON = 'ocr-polygon',
  GRID = 'grid',
  RECOGNITION = 'recognition',
  ARROW = 'arrow',
  TWO_SIDES_CUBOID = 'two-sides-cuboid',
}
