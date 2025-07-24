export type Ontology = {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color?: string;
  description?: string;
  attributes?: string;
  default_size?: {
    // for lidar cuboid
    width: number;
    height: number;
    length: number;
    threshold?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minLength?: number;
    maxLength?: number;
  };
  category_threshold?: {
    width?: number;
    length?: number;
    height?: number;
  };
  translation_required?: boolean;
  limits?: {
    // for plss
    shapeType: "polygon" | "rectangle" | "line" | "dot";
    operator: "eq" | "ne" | "gt" | "ge" | "lt" | "le";
    count: number;
  }[];
};
