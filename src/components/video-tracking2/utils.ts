import { v4 as uuidv4 } from 'uuid';
import { Base64 } from 'js-base64';
import { utils as formUtils } from '@appen-china/easy-form';
import { Field, FieldControlType, FieldOption, FieldValue } from '@appen-china/easy-form/es/types';
import { Instance, InstanceItem, CameraData, FrameData, Tool, LabelConfig, FieldConfig } from './types';
import { DEFAULT_CAMERA_NAME, DEFAULT_CATEGORY_ITEM } from './constants';
import { fetchResultByUrl } from '../../utils';
import { computeRotatedPosition } from '../../utils/math';
import { ShapeData, ShapeType } from '../common/shapes/types';
import type Shape from '../common/shapes/Shape';
import { RectangleData } from '../common/shapes/Rectangle';
import { DotData } from '../common/shapes/Dot';
import { PolygonData } from '../common/shapes/Polygon';
import { LineData } from '../common/shapes/Line';
import { precise } from '../common/shapes/utils';

/**
 * parse frames
 * @param frames
 */
export function parseFrames(frames: string | string[]) {
  if (typeof frames === 'string') {
    return frames.split(',').map((f) => f.trim());
  }
  return [...frames];
}

/**
 * parse frames config from frames
 * @param frames
 */
function parseFramesFromFrames(frames: unknown) {
  if ((typeof frames === 'string' && frames) || Array.isArray(frames)) {
    const defaultCamera = {
      camera: DEFAULT_CAMERA_NAME,
      frames: parseFrames(frames),
    };
    return [defaultCamera];
  }
  return null;
}

/**
 * parse frames from payload
 * @param payload
 */
export async function parseFramesByPaylod({ frames, base_url }: {
  frames?: string | string[];
  base_url?: string;
}) {
  const parseFromFrames = parseFramesFromFrames(frames);
  if (parseFromFrames !== null) {
    return parseFromFrames;
  }

  if (base_url) {
    try {
      const res: any = await fetchResultByUrl(base_url);
      if (res) {
        const parseFromFramesResult = parseFramesFromFrames(res.frames);
        if (parseFromFramesResult !== null) {
          return parseFromFramesResult;
        }
      }
    } catch (e) {
      // fetch error
    }
  }
  return [{
    camera: DEFAULT_CAMERA_NAME,
    frames: [],
  }];
}

/**
 * load instance from result
 * @param result
 */
export function loadInstancesFromResult(result: any) {
  const instances: Instance[] = [];

  if (result && result.instances && Array.isArray(result.instances)) {
    result.instances.forEach((instance: any) => {
      if (instance.frames) {
        // legacy data
        const defaultCamera: CameraData = {
          camera: DEFAULT_CAMERA_NAME,
          frames: instance.frames,
        };
        const defaultItem: InstanceItem = {
          id: uuidv4(),
          name: DEFAULT_CATEGORY_ITEM,
          number: 1,
          cameras: [defaultCamera],
        };
        const newInstance: Instance = {
          id: instance.id,
          category: instance.category,
          number: instance.number,
          children: [defaultItem],
        };
        instances.push(newInstance);
        // TODO: fix string points attribute for rectangle
      } else {
        instances.push(instance);
      }
    });
  }

  return instances;
}

/**
 * get predicted shape data
 * @param currentFrame
 * @param frames
 * @param bounds
 */
export function predictShapeData(
  currentFrame: number,
  frames: {[frameIndex: number]: FrameData},
  bounds?: { top: number; right: number; bottom: number; left: number },
) {
  // when shape already exists
  if (frames[currentFrame]) {
    return null;
  }

  const prevKeyFrameIndexes = getLastKeyFrames(2, currentFrame, frames);
  const nextKeyFrameIndexes = getNextKeyFrames(1, currentFrame, frames);

  if (nextKeyFrameIndexes.length === 1 && prevKeyFrameIndexes.length >= 1) {
    // prev & next has key frames
    const [startFrame] = prevKeyFrameIndexes;
    const [endFrame] = nextKeyFrameIndexes;
    if (frames[startFrame].shapeType === frames[endFrame].shapeType) {
      // same shape, use the range, else continue
      return getShapeFromFrames(frames, startFrame, endFrame, startFrame, currentFrame);
    }
  }

  if (nextKeyFrameIndexes.length <= 0 && prevKeyFrameIndexes.length >= 1) {
    // no next key frame
    if (prevKeyFrameIndexes.length === 1 || frames[prevKeyFrameIndexes[0]].shapeType !== frames[prevKeyFrameIndexes[1]].shapeType) {
      // just 1 prev key frame, or two prev key frame shapes are not same
      const { shapeType, shape } = frames[prevKeyFrameIndexes[0]];
      return { shapeType, shape };
    }
  }

  if (prevKeyFrameIndexes.length === 2) {
    // has 2 prev key frames
    const [endFrame, startFrame] = prevKeyFrameIndexes;
    const { shapeType, shape } = getShapeFromFrames(frames, startFrame, endFrame, endFrame, currentFrame);
    if (!bounds || checkShapeInBounds(shape, shapeType, bounds)) {
      return { shapeType, shape };
    }
  } else if (prevKeyFrameIndexes.length === 1) {
    // has 1 prev key frame
    const { shapeType, shape } = frames[prevKeyFrameIndexes[0]];
    return { shapeType, shape };
  }

  return null;
}

/**
 * get last {count} key frames
 * @param count
 * @param currentFrame
 * @param frames
 */
export function getLastKeyFrames(
  count: number,
  currentFrame: number,
  frames: {[frameIndex: number]: FrameData},
) {
  // find last n key frames
  let i = currentFrame - 1;
  const keyFrameIndexes = [];
  const minFrame = Math.min(...Object.values(frames).map((f) => f.frameIndex));
  while (i >= minFrame && keyFrameIndexes.length < count) {
    if (frames[i] && frames[i].isKeyFrame) {
      // find a key frame
      keyFrameIndexes.push(i);
    }
    i -= 1;
  }
  return keyFrameIndexes;
}

/**
 * get next {count} key frames
 * @param count
 * @param currentFrame
 * @param frames
 */
export function getNextKeyFrames(
  count: number,
  currentFrame: number,
  frames: {[frameIndex: number]: FrameData},
) {
  // find next n key frames
  let i = currentFrame + 1;
  const keyFrameIndexes = [];
  const maxFrame = Math.max(...Object.values(frames).map((f) => f.frameIndex));
  while (i <= maxFrame && keyFrameIndexes.length < count) {
    if (frames[i] && frames[i].isKeyFrame) {
      // find a key frame
      keyFrameIndexes.push(i);
    }
    i += 1;
  }
  return keyFrameIndexes;
}

/**
 * interpolate shape
 * @param frames
 * @param startFrame
 * @param endFrame
 * @param baseFrame
 * @param currentFrame
 */
export function getShapeFromFrames(
  frames: {[frameIndex: number]: FrameData},
  startFrame: number,
  endFrame: number,
  baseFrame: number,
  currentFrame: number,
) {
  const frameShapeType = frames[baseFrame].shapeType;
  const shapeInfo = {
    shapeType: frameShapeType,
    shape: frames[baseFrame].shape,
  };

  if (Object.values(frames).filter((f) => f.frameIndex >= startFrame && f.frameIndex <= endFrame).some((f) => f.shapeType !== frameShapeType)) {
    // shape type changes between start & end, can't calculate offsets
    return shapeInfo;
  }

  const startShape = frames[startFrame].shape;
  const endShape = frames[endFrame].shape;
  const baseShape = frames[baseFrame].shape;
  const frameScale = (currentFrame - baseFrame) / (endFrame - startFrame);

  switch (frameShapeType) {
    case ShapeType.RECTANGLE: {
      const shape = calculate(
        startShape as unknown as { [key: string]: number; },
        endShape as unknown as { [key: string]: number; },
        baseShape as unknown as { [key: string]: number; },
        frameScale,
      ) as unknown as RectangleData;
      const right = precise(shape.x + shape.width);
      const bottom = precise(shape.y + shape.height);
      const points = [
        { x: shape.x, y: shape.y },
        { x: right, y: shape.y },
        { x: right, y: bottom },
        { x: shape.x, y: bottom },
      ];
      if (shape.rotation) {
        points.forEach((p) => {
          const point = computeRotatedPosition({ x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 }, p, shape.rotation as number);
          p.x = precise(point.x);
          p.y = precise(point.y);
        });
      }

      shape.points = points;
      shapeInfo.shape = { ...shape };
      break;
    }
    case ShapeType.DOT: {
      shapeInfo.shape = calculate(
        startShape as unknown as { [key: string]: number; },
        endShape as unknown as { [key: string]: number; },
        baseShape as unknown as { [key: string]: number; },
        frameScale,
      ) as unknown as DotData;
      break;
    }
    default:
  }

  return shapeInfo;
}

/**
 * calculate interpolation data
 * @param start
 * @param end
 * @param base
 * @param scale
 */
function calculate(
  start: {[key: string]: number},
  end: {[key: string]: number},
  base: {[key: string]: number},
  scale: number,
) {
  const calculatedObject: {[key: string]: number} = {};
  Object.keys(base).forEach((key) => {
    if (start[key] !== undefined && end[key] !== undefined) {
      calculatedObject[key] = precise(base[key] + (end[key] - start[key]) * scale);
    }
  });
  return calculatedObject;
}

/**
 * check if ths shape is in image bounds
 * @param shape
 * @param shapeType
 * @param bounds
 */
export function checkShapeInBounds(
  shape: ShapeData,
  shapeType: ShapeType,
  bounds: { top: number; right: number; bottom: number; left: number },
) {
  switch (shapeType) {
    case ShapeType.RECTANGLE:
    case ShapeType.POLYGON:
    case ShapeType.LINE: {
      const points = (shape as RectangleData | PolygonData | LineData).points as { x: number; y: number }[];
      const allX = points.map((p) => p.x);
      const allY = points.map((p) => p.y);
      const left = Math.min(...allX);
      const right = Math.max(...allX);
      const top = Math.min(...allY);
      const bottom = Math.max(...allY);
      return left >= bounds.left && top >= bounds.top && right <= bounds.right && bottom <= bounds.bottom;
    }
    case ShapeType.DOT: {
      const { x, y } = shape as DotData;
      return x <= bounds.right && y <= bounds.bottom && x >= bounds.left && y >= bounds.top;
    }
    default:
  }
  return true;
}

/**
 * get shape type by tool name
 * @param tool
 */
export function getShapeTypeByTool(tool: Tool): ShapeType | undefined {
  switch (tool) {
    case Tool.RECTANGLE:
      return ShapeType.RECTANGLE;
    case Tool.POLYGON:
      return ShapeType.POLYGON;
    case Tool.LINE:
      return ShapeType.LINE;
    case Tool.DOT:
      return ShapeType.DOT;
    default:
  }
  return undefined;
}

/**
 * get tool type from frame data
 * @param shape
 */
export function getToolTypeFromFrameData(shape: FrameData) {
  switch (shape.shapeType) {
    case ShapeType.POLYGON:
      return Tool.POLYGON;
    case ShapeType.RECTANGLE:
      return Tool.RECTANGLE;
    case ShapeType.LINE:
      return Tool.LINE;
    case ShapeType.DOT:
      return Tool.DOT;
    default:
  }
  return undefined;
}

/**
 * parse label config
 * @param labelConfigStr
 */
export function parseLabelConfig(labelConfigStr?: string) {
  if (labelConfigStr) {
    try {
      const labelConfig = JSON.parse(Base64.decode(labelConfigStr));
      return labelConfig;
    } catch (e) {
      // parse error
    }
  }
  return undefined;
}

/**
 * set initial values for fields
 * @param fields
 * @param values
 */
export function setInitialValues(fields: Field[], values: any) {
  return fields.map((field) => ({
    ...field,
    ...values && values[field.name] !== undefined && {
      defaultValue: values[field.name],
    },
  }));
}

/**
 * parse fields (with options), return a name-field map
 * @param config
 */
export function parseFields(config?: LabelConfig) {
  const map: { [fieldName: string]: FieldConfig } = {};
  (config?.fields || []).forEach((field) => {
    const { name, label, type, valueType, options = [] } = field;
    const newField: FieldConfig = { name, type, label };
    if (type === FieldControlType.RADIO || type === FieldControlType.SELECT || type === FieldControlType.CHECKBOX) {
      // has options
      newField.options = formUtils.parseOptions(options, valueType);
    }
    map[name] = newField;
  });
  return map;
}

/**
 * get upper shape for target shape
 * @param targetShape
 * @param shapes
 */
export function getUpperShape(targetShape: Shape<ShapeData>, shapes: Shape<ShapeData>[]) {
  let upperShape;
  for (let i = 0; i < shapes.length; i += 1) {
    const shape = shapes[i];
    if (shape.order > targetShape.order) { // upper
      if (!upperShape) {
        upperShape = shape;
      } else if (upperShape.order > shape.order) {
        upperShape = shape;
      }
    }
  }
  return upperShape;
}

/**
 * get under shape for target shape
 * @param targetShape
 * @param shapes
 */
export function getUnderShape(targetShape: Shape<ShapeData>, shapes: Shape<ShapeData>[]) {
  let underShape;
  for (let i = 0; i < shapes.length; i += 1) {
    const shape = shapes[i];
    if (shape.order < targetShape.order) { // under
      if (!underShape) {
        underShape = shape;
      } else if (underShape.order < shape.order) {
        underShape = shape;
      }
    }
  }
  return underShape;
}

/**
 * precise shape data by shape type
 * @param shapeType
 * @param shapeData
 */
export function preciseShapeByType(shapeType: ShapeType, shapeData: ShapeData) {
  switch (shapeType) {
    case ShapeType.RECTANGLE: {
      const { rotation } = shapeData as RectangleData;
      preciseData(shapeData);
      if (rotation !== undefined) {
        (shapeData as RectangleData).rotation = rotation;
      }
      break;
    }
    case ShapeType.POLYGON:
    case ShapeType.LINE:
    case ShapeType.DOT:
      preciseData(shapeData);
      break;
    default:
  }
}

/**
 * precise data
 * @param data
 */
export function preciseData(data: any) {
  if (Array.isArray(data)) {
    // array
    data.forEach((item, i) => {
      if (typeof item === 'number') {
        data[i] = precise(item);
      } else {
        preciseData(item);
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    // object
    const allKeys = Object.keys(data);
    allKeys.forEach((key) => {
      const keyData = data[key];
      if (typeof keyData === 'number') {
        data[key] = precise(keyData);
      } else {
        preciseData(keyData);
      }
    });
  }
}

/**
 * get field option label
 * @param value
 * @param options
 */
export function getFieldOptionLabel(value: FieldValue, options: FieldOption[]) {
  const option = options.find((o) => o.value === value);
  return option?.label || `${value}`;
}

/**
 * get field display label
 * @param value
 * @param field
 */
export function getFieldDisplayLabel(fieldValue: FieldValue | FieldValue[], field?: FieldConfig) {
  let displayValue = '';
  if (fieldValue !== undefined && fieldValue !== null) {
    if (field?.options) {
      displayValue = Array.isArray(fieldValue)
        ? `${fieldValue.map((v) => getFieldOptionLabel(v, field.options!))}`
        : getFieldOptionLabel(fieldValue, field.options);
    } else {
      displayValue = `${fieldValue}`;
    }
  }
  return displayValue;
}
