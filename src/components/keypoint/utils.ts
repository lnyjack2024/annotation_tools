import { Dispatch, SetStateAction } from 'react';
import { Field } from '@appen-china/easy-form/es/types';
import { Base64 } from 'js-base64';
import { v4 as uuid } from 'uuid';
import hexToRgba from 'hex-to-rgba';
import rootStore from './store/RootStore';
import { OntologyItem } from './store/OntologyStore';
import {
  InstanceListItem, LandmarkEditType, Rectangle, UpdatedShape,
  CategoryItem, PointListItem, InstanceAct, Shapes, CurrentShapes,
  Points, CategoryInstancesMap, KeypointCategoryProps, Frame,
  LabelItem, LabelFormat, LabelStyle, ValidationType, Image,
} from './types';
import { IWarning } from '../common/tabs-menu/Validator';
import { getFieldDisplayLabel } from '../../utils/form';

/* eslint-disable no-param-reassign */

export function parseFrames(frames: string | string[]) {
  return (
    typeof frames === 'string' ?
      (frames as string).split(',') :
      frames
  ).map((f, i) => ({ url: f.trim(), valid: true, index: i }));
}

export async function parseFramesByPaylod({ frames, imageData }: { frames?: string | string[]; imageData?: Image[] }) {
  let parsedFrames: Image[] = [];
  if (frames) {
    parsedFrames = parseFrames(frames);
  }
  if (imageData) {
    parsedFrames = imageData.map((v, index) => (typeof v === 'string' ? {
      url: v,
      valid: true,
      index,
    } : {
      url: v.url,
      valid: v.valid !== undefined ? v.valid : true,
      index,
    }));
  }
  return parsedFrames;
}

export function getValuesLabel(fields: Field[] | undefined, values: any, labelItems: LabelItem[]) {
  let content = '';
  if (fields && values) {
    for (let i = 0; i < fields.length; i += 1) {
      const { name, label, visible } = fields[i];
      if (rootStore.setting.labelFormat === LabelFormat.DEFAULT) {
        content = `\n${content}`;
      }
      if (visible || (!visible && values[name])) {
        if (labelItems.includes(LabelItem.ATTRIBUTE_KEYS)) {
          content += `${label || name}: `;
        }

        if (labelItems.includes(LabelItem.ATTRIBUTE_VALUES)) {
          content += `${getFieldDisplayLabel(values[name], fields[i]) || ''}`;
        }
      }
      if (i < fields.length - 1 && content) {
        content += ';';
      }
    }
  }
  return content;
};

export function resetAttrLabelPosition(label: paper.Group, position: { x: number, y: number }, visible?: boolean) {
  if (visible !== undefined) {
    label.visible = visible;
  }

  label.position.x = position.x;
  label.position.y = position.y;
  if (rootStore.setting.labelStyle === LabelStyle.DEFAULT) {
    label.children[0].position.x = position.x;
    label.children[0].position.y = position.y;
  }
  label.children.slice(-1)[0].position.x = position.x;
  label.children.slice(-1)[0].position.y = position.y;
}

// load result
export function loadInstancesFromResult(instances: InstanceListItem[]) {
  const newInstances: {[id: string]: InstanceAct} = {};
  const categoryInstancesMap: CategoryInstancesMap = {};
  instances.forEach((instanceData) => {
    const { category, children: defaultChildren, number } = instanceData;
    const id = instanceData.id || uuid();
    let notEmpty = 0;

    const ontologyItem = rootStore.ontology.ontology.find((onto) => onto.class_name === category);
    if (ontologyItem) {
      const children = ontologyItem.children.map((group) => {
        const groupFrames = defaultChildren.find((c) => c.name === group.name)?.frames;
        const frames: {[frameIndex: number]: Frame} = {};
        if (Array.isArray(groupFrames)) {
          groupFrames.forEach((frame) => {
            if (frame) {
              notEmpty += frame.shapes.length;
              const shapes: Shapes = {};
              frame.shapes.forEach((shape: any) => {
                if (shape) {
                  if (group.type === LandmarkEditType.KEYPOINT) {
                    const point = shape as PointListItem;
                    const { index, ...rest } = point;
                    if (index || index === 0) {
                      const realCategory = group && Array.isArray(group.categories) && group.categories.find((c) => c.range && c.range.length === 2 && index >= c.range[0] && index <= c.range[1]);
                      if (realCategory) {
                        // fix pointCategory and key point info for saved data
                        rest.pointCategory = realCategory.name;
                        rest.isKeyPoint = realCategory.keys.includes(index);
                        rest.visible = rest.visible !== false;
                        (shapes as Points)[index] = rest;
                      }
                    }
                  } else if (group.type === LandmarkEditType.RECTANGLE) {
                    const rectangle = shape as Rectangle;
                    (shapes as CurrentShapes)[rectangle.id] = rectangle;
                  }
                }
              });
              frames[frame.frameIndex] = {
                frameIndex: frame.frameIndex,
                count: frame.shapes.length,
                shapes,
                attributes: frame.attributes
              };
            }
          });
        }
        return {
          name: group.name,
          shapeType: group.type,
          count: groupFrames?.reduce((n, f) => n + (f ? f.shapes.length : 0), 0) || 0,
          frames,
        };
      }) || [];
      newInstances[id] = {
        ...instanceData,
        id,
        notEmpty,
        children
      };
    }
    // add to categoryInstancesMap
    if (!categoryInstancesMap[category]) {
      categoryInstancesMap[category] = {};
    }
    categoryInstancesMap[category][id] = number;
  });
  return {
    newInstances,
    categoryInstancesMap
  };
}

export function getFrameShapes(instances: InstanceAct[], currentFrame: number, isRemove = false) {
  const updateShapes: UpdatedShape[] = [];
  const updatedCategories: KeypointCategoryProps[] = [];
  instances.filter((v) => !!v).forEach(({ id, category, children }) => {
    if (Array.isArray(children)) {
      children.forEach((group) => {
        const currentFrameGroup = group.frames[currentFrame];
        if (currentFrameGroup) {
          Object.keys(currentFrameGroup.shapes).forEach((key) => {
            const shape = group.shapeType === LandmarkEditType.KEYPOINT ?
              (currentFrameGroup.shapes as Points)[Number(key)] :
              (currentFrameGroup.shapes as CurrentShapes)[key];
            if (shape) {
              const updateShape = {
                frameIndex: currentFrame,
                instanceId: id,
                category,
                groupName: group.name,
                shape: isRemove ? undefined : shape,
                shapeType: group.shapeType
              };
              if (group.shapeType === LandmarkEditType.KEYPOINT) {
                updateShapes.push({
                  ...updateShape,
                  index: Number(key),
                });
                const { position, pointCategory, index, isKeyPoint } = shape as PointListItem;
                if (position !== undefined && pointCategory !== undefined && index !== undefined && isKeyPoint !== undefined) {
                  if (updatedCategories.findIndex((v) => v.pointCategory === pointCategory) < 0) {
                    updatedCategories.push({
                      frameIndex: currentFrame,
                      pointCategory,
                      instanceId: id,
                      groupName: group.name,
                      category
                    });
                  }
                }
              } else if (group.shapeType === LandmarkEditType.RECTANGLE) {
                updateShapes.push({
                  ...updateShape,
                  id: key,
                });
              }
            }
          });
        }
      });
    }
  });
  return {
    updateShapes,
    updatedCategories
  };
}

export function initInstances(points: PointListItem[], frameCount: number) {
  const newPoints = points.map((point) => ({ ...point, index: point.index }));
  const ontologyItem = rootStore.ontology.ontology.find((onto) => onto.class_name === 'Ontology');
  const children = ontologyItem?.children.filter((group) => group.name !== 'default').map((group) => (({
    ...group,
    name: group.name,
    shape_type: group.type,
    frames: Array.from({ length: frameCount }).map((v, i) => (i === 0 ? {
      frameIndex: i,
      count: points.length,
      shapes: newPoints
    } : undefined))
  }))) || [];
  return [{
    id: uuid(),
    index: 1,
    color: '#5cdef0',
    ontology: 'Ontology',
    children
  }];
}

// init ontology
export function initOntology(loadOntology: OntologyItem[] | CategoryItem[]) {
  let list:OntologyItem[] = [];
  if ((loadOntology as OntologyItem[]).find((v) => v.class_name)) {
    list = (loadOntology as OntologyItem[]).map((o) => ({
      ...o,
      children: o.children && o.children.map((child) => {
        let groupConfig = null;
        let pointConfig = null;
        if (typeof child.label_config === 'string') {
          try {
            groupConfig = JSON.parse(Base64.decode(child.label_config));
          } catch (e) {
            // parse error
          }
        }
        if (typeof child.point_label_config === 'string') {
          try {
            pointConfig = JSON.parse(Base64.decode(child.point_label_config));
          } catch (e) {
            // parse error
          }
        }
        return {
          ...child,
          display_color: o.display_color || '#5cdef0',
          lines: child.lines ? child.lines.map((v) => ({
            ...v,
            // points: v.points.sort((a, b) => a - b)
            points: [...v.points],
          })) : [],
          label_config: groupConfig,
          point_label_config: pointConfig
        };
      })
    }));
  } else {
    // for older version
    list = [
      {
        class_name: 'Ontology',
        display_color: '#5cdef0',
        children: [
          {
            name: 'default',
            type: LandmarkEditType.KEYPOINT,
            categories: ((loadOntology as CategoryItem[]).map((v) => ({ ...v, isConnect: true })) as CategoryItem[]),
            lines: [],
            count: (loadOntology as CategoryItem[]).reduce((total: number, pointCategory: CategoryItem) => total + (pointCategory.range[1] - pointCategory.range[0] + 1), 0),
            reference: '',
            label_config: null,
            point_label_config: null,
          }
        ]
      },
    ];
  };
  return list;
}

export function resizeLabel(
  size: {width: number, height: number, zoom: number, fontSize: number},
  oldZoom: number,
  point: number[],
  label: paper.Item,
  type = 'attr'
) {
  if (!label || !label.children) {
    return;
  }
  (label.children.slice(-1)[0] as paper.PointText).set({
    fontSize: size.fontSize / size.zoom,
    shadowBlur: 2 / size.zoom,
    shadowOffset: 2 / size.zoom,
  });
  const scale = size.zoom / oldZoom;
  const [x, y] = point;
  const newWidth = size.width / scale;
  const newHeight = size.height / scale;
  if (rootStore.setting.labelStyle === LabelStyle.DEFAULT) {
    (label.children[0] as paper.Shape).size.width = newWidth;
    (label.children[0] as paper.Shape).size.height = newHeight;
  }
  let position = { x, y };
  if (type === 'label') {
    position = {
      x: x + newWidth / 2,
      y: y - newHeight / 2
    };
  }
  resetAttrLabelPosition(label as paper.Group, position);
}

export function getRGBAColor(displayColor?: string, alpha = 0.2) {
  if (displayColor) {
    return hexToRgba(displayColor, alpha);
  }
  return '#FFFFFF';
};

export function getInstanceFrames(instance?: InstanceAct) {
  const frameStatus: { [frameIndex: number]: boolean } = {};
  if (instance) {
    instance.children.forEach((group) => {
      Object.values(group.frames).forEach((frame) => {
        if (frame && frame.count > 0) {
          frameStatus[frame.frameIndex] = false;
        }
      });
    });
  }
  return frameStatus;
};

export const getNextState = <S>(setState: Dispatch<SetStateAction<S>>) => new Promise<S>((resolve) => {
  setState((preState) => {
    resolve(preState);
    return preState;
  });
});
