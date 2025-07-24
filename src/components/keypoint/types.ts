import { Field, Condition, Effect, Rule } from '@appen-china/easy-form/es/types';
import { OntologyItem } from './store/OntologyStore';
import JobProxy from '../../libs/JobProxy';

export interface Payload {
  job_id: string;
  task_id: string;
  record_id: string;
  worker_id: string;
  image: string;
  ontology: OntologyItem[] | CategoryItem[];
  jobProxy: JobProxy;
  review_from?: string;
  initial_result?: string;
  check_missing_points?: boolean;
  issue_types?: string;
  locale?: string;
  path_style?: PathStyles;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadContent: (filename: string, jobId: string) => Promise<any>;
  renderComplete: () => Promise<void>;
}

export interface CategoryItem {
  name: string;
  range: number[];
  keys: number[];
  reference?: string;
  isConnect?: boolean;
  displayColor?: string;
}

export enum LandmarkEditType {
  KEYPOINT = 'keypoint',
  RECTANGLE = 'rectangle',
}

export interface Line {
  points: [number, number];
  color: string;
}

export interface FormConfig {
  fields: Field[];
  conditions?: Condition[];
  effects?: Effect[];
  rules?: Rule[];
}

export enum CategoryPathShape {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
}

export interface Point {
  pointCategory?: string;
  isKeyPoint?: boolean;
  position?: {
    x: number;
    y: number;
  };
  attributes?: {
    [attr: string]: any;
  };
  visible?: boolean;
}

export interface PointListItem extends Point {
  index?: number;
}

export interface InstanceStatus {
  frameIndex: number;
  id: string;
  instance?: InstanceAct;
}

export interface GroupStatus extends FrameGroup {
  attributes?: {[attr: string]: any;};
}

export interface PointStatus extends FrameGroup {
  index: number;
  point?: Point;
}

export interface CategoryPathShapeStatus {
  frameIndex: number;
  pointCategory: string;
  shape?: CategoryPathShape;
}

export interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  displayColor: string;
  visible?: boolean;
}

export interface Group {
  instanceId: string;
  category: string;
  groupName: string;
  shapeType?: LandmarkEditType;
  displayColor?: string;
}

export interface FrameGroup extends Group {
  frameIndex: number;
}

export interface RectangleStatus extends FrameGroup {
  id: string;
  rectangle?: Rectangle;
}

export interface UpdatedShape extends FrameGroup {
  id?: string;
  index?: number;
  pointCategory?: string;
  shapeType: LandmarkEditType;
  shape?: Point | Rectangle;
}

export interface InstanceGroup {
  name: string;
  display_name?: string;
  shapeType: LandmarkEditType;
}

export interface Points { [index: number]: Point; };

export interface CurrentShapes { [shapeId: string]: Rectangle; };

export type Shapes = Points | CurrentShapes;

export interface Frame {
  frameIndex: number;
  count: number;
  shapes: Shapes;
  attributes?: {[key: string]: any;}
}
export interface InstanceGroupAct extends InstanceGroup {
  count: number;
  frames: {[frameIndex: number]: Frame};
}
export interface InstanceGroupStatus extends InstanceGroup {
  frames: {
    frameIndex: number,
    number: number;
    shapes: { [index: number]: PointStatus; } | { [shapeId: string]: RectangleStatus; };
    attributes?: {[key: string]: any;};
  }[];
}
export interface InstanceGroupListItem extends InstanceGroup {
  frames: ({
    frameIndex: number,
    shapes: PointListItem[] | Rectangle[];
    attributes?: {[key: string]: any;};
  } | undefined)[];
}

export interface InstanceAct {
  id: string;
  category: string;
  displayColor?: string;
  number: number;
  notEmpty: number;
  children: InstanceGroupAct[];
}

export interface InstanceListItem {
  id: string;
  category: string;
  number: number;
  displayColor?: string;
  children: InstanceGroupListItem[];
}

export interface GroupInfo extends Group {
  shapeType?: LandmarkEditType;
  displayColor?: string;
}

export interface PointInfo extends GroupInfo {
  pointCategory: string;
  isKeyPoint: boolean;
}

export interface ShapeInfo extends GroupInfo {
  frameIndex: number;
  id?: string | number;
}

export interface ObjectInfo extends Group {
  index?: number;
  point?: Point;
}

export interface CategoryInstancesMap {
  [category: string]: {
    [instanceId: string]: number; // instance id -> instance num
  };
}

export interface KeypointCategoryProps extends Group {
  frameIndex: number;
  pointCategory: string;
}

export enum DELETETYPE {
  CURRENT = 'CURRENT',
  FOLLOW = 'FOLLOW',
  ALL = 'ALL'
}

export enum ValidationType {
  ATTR_EMPTY = 'attr_empty',
  CUSTOM = 'custom',
  QUALITY = 'quality',
}

export enum LabelItem {
  CATEGORY = 'category',
  NUMBER = 'number',
  TOOL_NAME = 'tool-name',
  ATTRIBUTE_KEYS = 'attribute-keys',
  ATTRIBUTE_VALUES = 'attribute-values',
}

export enum LabelStyle {
  DEFAULT = 'default',
  TRANSPARENT = 'transparent'
}

export enum LabelFormat {
  DEFAULT = 'default',
  COMPRESSED = 'compressed',
}

export enum ReviewResult {
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
}

export interface ReviewData {
  result: ReviewResult;
  type?: string[];
  comment?: string;
}

export interface Review extends ReviewData {
  instanceId: string;
  groupName: string;
  frameIndex: number;
  shapeIds: (number | string)[];
}

export interface MissingReview extends ReviewData {
  id: string;
  number: number;
  frameIndex: number;
  data?: MissingReviewData;
}
export type MissingReviewData = DotData;
interface DotData {
  position: {
    x: number;
    y: number;
  }
}

export interface Summary {
  ids: string[]
  category: string;
  shape?: LandmarkEditType;
  count: number;
  distinctCount: number;
}

export interface Element {
  instance: string;
  id: string | number;
  shape?: LandmarkEditType;
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
  annotatedFrames: Set<any>;
}

export interface Image {
  url: string;
  valid: boolean;
  index: number;
}

export enum PathStyles {
  DEFAULT = 'default',
  CURVES = 'curves',
}

export enum HandleType {
  HANDLE_IN = 'handle-in',
  HANDLE_OUT = 'handle-out',
}

export interface Handle {
  frameIndex: number;
  instanceId: string;
  groupName: string;
  handleIn: {x: number, y: number};
  handleOut: {x: number, y: number};
  pointIndex: number;
  pointPosition: {x: number, y: number};
  pathId: string;
}

export interface HandleStatus {
  frameIndex: number;
  pathId: string;
  pointIndex: number;
  handle: Handle | null;
}
