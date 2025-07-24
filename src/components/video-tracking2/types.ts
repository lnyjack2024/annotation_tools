import { Application } from 'pixi.js';
import { Field, Condition, Effect, Rule, FieldControlType, FieldOption } from '@appen-china/easy-form/es/types';
import { ShapeType, ShapeData } from '../common/shapes/types';
import JobProxy from '../../libs/JobProxy';

export enum Tool {
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  LINE = 'line',
  DOT = 'dot',
}

export interface Payload {
  locale?: string;
  issue_types?: string;
  ontology: Ontology[];
  base_url?: string;
  frames?: string | string[];
  frame_config?: string;
  is_fill?: string | boolean;
  fill_opacity?: string | number;
  show_vertex?: string | boolean;
  show_vertex_order?: string | boolean;
  measurement_box?: string;
  rotatable?: string | boolean;
  auto_snap_point?: string | boolean;
  app: Application;
  jobProxy: JobProxy;
}

export interface Ontology {
  class_name: string;
  display_name?: string;
  display_color?: string;
  label_config_dynamic?: string;
  children?: {
    name: string;
    display_name?: string;
    display_color?: string;
    count?: number | null;
    label_config?: string;
    label_config_point?: string;
    // legacy tool config
    type?: string;
    // current tool config
    tools?: ({
      type: string;
    })[];
  }[];
}

export interface Category {
  className: string;
  displayName: string;
  displayColor: string;
  labelConfigDynamic?: LabelConfig;
  children: CategoryItem[];
}

export interface CategoryItem {
  name: string;
  displayName: string;
  displayColor: string;
  count?: number;
  labelConfig?: LabelConfig;
  pointLabelConfig?: LabelConfig;
  tools: ToolItem[];
}

export interface ToolItem {
  type: Tool;
}

export interface LabelConfig {
  fields: Field[];
  conditions?: Condition[];
  effects?: Effect[];
  rules?: Rule[];
}

export interface FieldConfig {
  name: string;
  type: FieldControlType;
  label?: string;
  options?: FieldOption[];
}

export interface Instance {
  id: string;
  category: string;
  categoryName?: string;
  categoryColor?: string;
  number: number;
  attributes?: any;
  dynamicAttributes?: InstanceDynamicAttributes[];
  children: InstanceItem[];
}

export interface InstanceDynamicAttributes {
  camera: string;
  frames: DynamicAttributes[];
}

export interface DynamicAttributes {
  frameIndex: number;
  attributes?: any;
}

export interface InstanceItem {
  id: string;
  name: string;
  number: number;
  cameras: CameraData[];
}

export interface CameraData {
  camera: string;
  frames: FrameData[];
}

export interface FrameData {
  frameIndex: number;
  isKeyFrame: boolean;
  shapeType: ShapeType;
  shape: ShapeData;
  order?: number;
  attributes?: any;
}

export enum ReviewMode {
  LABELING = 'labeling',
  REVIEW = 'review',
}

export enum ReviewResult {
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
}

export interface Summary {
  ids: string[]
  category: string;
  shape?: Tool;
  count: number;
  distinctCount: number;
}

export interface Element {
  id: string;
  shape?: Tool;
  frame: number;
  category: string;
  label?: { [key: string]: string };
}

export interface Statistic {
  elements: Element[];
  categories: string[];
  shapes: Set<any>;
  summary: { [key: string]: Summary };
  frameCount: number;
  validFrames: Set<any>;
  annotatedFrames: Set<any>;
  instanceCount: number;
  distinctInstanceCount: number;
}

export interface Review {
  id: string;
  camera: string;
  frameIndex: number;
  result: ReviewResult;
  type?: string[];
  comment?: string;
  instanceId?: string; // related instance
  instanceItemId?: string; // related instance item
  position: {
    x: number;
    y: number;
  };
}

export interface FrameAttributes {
  frameIndex: number;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  valid: boolean;
  originValid?: boolean;
  rotation: number;
  attributes?: any;
}

export interface CameraFrameAttributes {
  camera: string;
  frames: FrameAttributes[];
}
