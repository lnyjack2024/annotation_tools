import React, { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Observer, useLocalObservable, useObserver } from 'mobx-react';
import { cloneDeep } from 'lodash';
import { notification } from 'antd';
import { v4 as uuid } from 'uuid';
import { toJS } from 'mobx';
import TabMenu from '../common/tabs-menu/TabMenu';
import AutoSaver from '../common/AutoSaver';
import Toolbar from './components/Toolbar';
import SideMenus from './components/SideMenus';
import Board from './components/Board';
import Canvas from './components/Canvas';
import FrameControl from './components/FrameContorl';
import Validator from './components/Validator';
import Attributes, { AttributesHandle } from './components/Attributes';
import QualityControl from './components/QualityControl';
import Information from './components/Information';
import FrameAttributes from './components/FrameAttributes';
import formatMessage, { i18n } from './locales';
import { Status } from './store/UndoStore';
import { AttributesMode } from './store/SettingsStore';
import {
  LandmarkEditType, InstanceListItem, CategoryPathShape, Point, PointListItem, PointStatus, FrameGroup,
  ShapeInfo, PointInfo, Group, InstanceAct, Rectangle, GroupInfo, FormConfig, ObjectInfo, UpdatedShape,
  Points, CurrentShapes, CategoryInstancesMap, KeypointCategoryProps, DELETETYPE, Frame, ReviewResult,
  Payload, Statistic, Image, HandleStatus
} from './types';
import { fetchResultByUrl } from './request';
import loader, { ImagePreloader } from '../../utils/image-preloader';
import { isPreview, isAnnotationReadonly } from '../../utils/tool-mode';
import {
  initInstances,
  loadInstancesFromResult,
  getFrameShapes,
  parseFramesByPaylod,
  getInstanceFrames,
} from './utils';
import './index.scss';
import rootStore from './store/RootStore';
import useAsyncState from './useAsyncState';
import Missing from './components/QualityControl/Missing';

notification.config({ top: 60 });

enum CANVASSTATUS {
  INITIAL = 'initial',
  LANDMARK = 'landmark',
}

export interface GroupReviewsMap {
  [groupName: string]: {
    approveCount: number;
    result?: ReviewResult;
  }
}

export interface InstancesReviewsMap {
  [instanceId: string]: {
    [frameIndex: number]: {
      approveCount: number;
      result?: ReviewResult;
      children: GroupReviewsMap
    }
  }
}

const LandmarkAnnotation = forwardRef((props: Payload, ref) => {
  const store = useLocalObservable(() => rootStore);

  const [readonly, setReadOnly] = useState(false);
  /**
   * frame image urls
   */
  const [frames, setFrames] = useState<Image[]>([]);

  /**
   * current frame index
   */
  const [currentFrame, setCurrentFrame] = useAsyncState<number>(-1);

  /**
   * frame control height (default is 48 + 30 = 78)
   */
  const [frameControlHeight, setFrameControlHeight] = useState<number>(78);

  const [selectedOntologyGroup, setSelectedOntologyGroup] = useState<string>('');

  const [categoryPathShapes, setCategoryPathShapes] = useAsyncState<{ [categoryKey: string]: CategoryPathShape }>({});

  const [updatedCategories, setUpdatedCategories] = useAsyncState<KeypointCategoryProps[]>([]);

  const [defaultInstances, setDefaultInstances] = useAsyncState<{ [id: string]: InstanceAct }>({});

  const [instances, setInstances] = useAsyncState<{ [id: string]: InstanceAct }>({});

  /**
   * image preloader
   */
  const [imagePreloader, setImagePreloader] = useState<ImagePreloader | null>(null);

  /**
   * selected shape info
   */
  const [selectedShapeStatus, setSelectedShapeStatus] = useState<ShapeInfo>({
    frameIndex: -1,
    category: '',
    instanceId: '',
    groupName: '',
    shapeType: undefined,
    id: undefined
  });

  const [loading, setLoading] = useState<boolean>(false);

  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

  const [formValues, setFormValues] = useState<{ [attr: string]: any; } | null>(null);

  const [imageSize, setImageSize] = useState<{ width: number, height: number } | undefined>({ width: 0, height: 0 });

  const [editFormObject, setEditFormObject] = useState<ObjectInfo | null>(null);

  /**
   * is review mode
   */
  const [isReview, setIsReview] = useState<boolean>(false);

  /**
   * initial instances, used to review
   */
  const [initialInstances, setInitialInstances] = useState<{ [id: string]: InstanceAct }>({});

  /**
   * category instances
   */
  const [initialCategoryInstancesMap, setInitialCategoryInstancesMap] = useState<CategoryInstancesMap>({});

  const [initialCategoryPathShapes, setInitialCategoryPathShapes] = useState<{ [categoryKey: string]: CategoryPathShape }>({});

  /**
   * attributes reference
   */
  const attributesRef = useRef<AttributesHandle>(null);

  /**
   * auto saver reference
   */
  const saverRef = useRef<AutoSaver>(null);

  /**
   * validator reference
   */
  const validatorRef = useRef<Validator>(null);

  const canvas = useRef<Canvas>(null);

  const isDrawMode = useMemo(() => (
    store.review.drawMode
  ), [store.review.drawMode]);

  const displayedInstances = useMemo(() => (
    isReview ? initialInstances : instances
  ), [isReview, initialInstances, instances]);

  const instanceIds = useMemo(() => (
    Object.keys(displayedInstances)
  ), [displayedInstances]);

  const instanceList = useMemo(() => (
    Object.values(displayedInstances).filter((v) => !!v)
  ), [displayedInstances]);

  const selectedInstance = useMemo(() => {
    if (selectedShapeStatus?.instanceId) {
      return displayedInstances[selectedShapeStatus.instanceId];
    }
    return undefined;
  }, [selectedShapeStatus, displayedInstances]);

  /**
   * category instances (used for sidebar render)
   */
  const categoryInstancesMap = useMemo(() => {
    const newCategoryInstancesMap: CategoryInstancesMap = {};
    instanceList.forEach(({ category, id, number }) => {
      if (!newCategoryInstancesMap[category]) {
        newCategoryInstancesMap[category] = {};
      }
      newCategoryInstancesMap[category][id] = number;
    });

    return newCategoryInstancesMap;
  }, [isReview, initialInstances, instanceList]);

  const displayedCategoryInstancesMap = useMemo(() => (
    isReview ? initialCategoryInstancesMap : categoryInstancesMap
  ), [isReview, initialCategoryInstancesMap, categoryInstancesMap]);

  const displayedCategoryPathShapes = useMemo(() => (
    isReview ? initialCategoryPathShapes : categoryPathShapes
  ), [isReview, initialCategoryPathShapes, categoryPathShapes]);

  const selectedOntology = useObserver(() => {
    const ontologyItem = store.ontology.ontology.find((category) => category.class_name === selectedInstance?.category);
    return ontologyItem;
  });

  const ontologyGroup = useObserver(() => {
    const ontologyItem = store.ontology.ontology.find((category) => category.class_name === selectedInstance?.category);
    const groupItem = ontologyItem && ontologyItem.children && ontologyItem.children.find((group) => group.name === selectedOntologyGroup);
    return groupItem;
  });

  const categories = useMemo(() => (
    ontologyGroup?.categories || []
  ), [ontologyGroup]);

  const selectedCategoryIndex = useMemo(() => {
    const id = selectedShapeStatus?.id as number;
    return selectedShapeStatus.shapeType === LandmarkEditType.KEYPOINT ?
      categories.findIndex((c) => c.range && c.range.length === 2 && id >= c.range[0] && id <= c.range[1]) :
      -1;
  }, [selectedShapeStatus, categories]);

  const instancesFrames = useMemo(() => {
    const items: {
      [id: string]: {
        [frameIndex: number]: boolean;
      }
    } = {};
    instanceList.forEach((instance) => {
      items[instance.id] = getInstanceFrames(instance);
    });
    return items;
  }, [instanceList]);

  const shapes = useMemo(() => {
    const group = selectedInstance?.children.find((g) => g.name === selectedOntologyGroup)?.frames[currentFrame];
    return (group && group.shapes) || {};
  }, [selectedInstance, selectedOntologyGroup, currentFrame]);

  const selectedShapeInfo = useMemo(() => {
    let info: PointInfo | GroupInfo | null = null;
    if (selectedShapeStatus) {
      info = {
        category: selectedShapeStatus.category,
        instanceId: selectedShapeStatus.instanceId,
        groupName: selectedShapeStatus.groupName,
        shapeType: ontologyGroup?.type || undefined,
        displayColor: selectedOntology?.display_color || ''
      };
      if (ontologyGroup?.type === LandmarkEditType.KEYPOINT && selectedCategoryIndex >= 0) {
        info = {
          ...info,
          pointCategory: categories[selectedCategoryIndex]?.name,
          isKeyPoint: categories[selectedCategoryIndex].keys.includes(selectedShapeStatus.id as number)
        };
      }
    }
    return info;
  }, [selectedShapeStatus, selectedCategoryIndex, ontologyGroup]);

  const annotatedPointOrShapeCount = useMemo(() => (
    Object.entries(shapes).filter(([, v]) => v !== undefined).length
  ), [shapes]);

  const totalPointCount = useMemo(() => (
    ontologyGroup?.count || 0
  ), [ontologyGroup]);

  const instancesReviewsMap = useObserver(() => {
    const map: InstancesReviewsMap = {};
    store.review.reviews.forEach((review) => {
      const { frameIndex, instanceId, groupName, shapeIds, result } = review;
      const category = instances[instanceId]?.category;
      if (!category) return;
      if (!map[instanceId]) {
        map[instanceId] = {};
      }
      if (!map[instanceId][frameIndex]) {
        map[instanceId][frameIndex] = {
          approveCount: 0,
          children: {}
        };
      }
      if (!map[instanceId][frameIndex].children[groupName]) {
        map[instanceId][frameIndex].children[groupName] = {
          approveCount: 0,
        };
      }

      if (result === ReviewResult.REJECT) {
        map[instanceId][frameIndex].result = result;
        map[instanceId][frameIndex].children[groupName].result = result;
      } else if (result === ReviewResult.SUSPEND) {
        if (map[instanceId][frameIndex].result !== ReviewResult.REJECT) {
          map[instanceId][frameIndex].result = result;
        }
        if (map[instanceId][frameIndex].children[groupName].result !== ReviewResult.REJECT) {
          map[instanceId][frameIndex].children[groupName].result = result;
        }
      } else if (result === ReviewResult.APPROVE) {
        const len = shapeIds.length;
        map[instanceId][frameIndex].approveCount += len;
        map[instanceId][frameIndex].children[groupName].approveCount += len;
        const ontologyCount = store.ontology.ontologyMap[category];
        if (map[instanceId][frameIndex].approveCount === ontologyCount.count) {
          map[instanceId][frameIndex].result = ReviewResult.APPROVE;
        }
        if (map[instanceId][frameIndex].children[groupName].approveCount === ontologyCount.children[groupName]) {
          map[instanceId][frameIndex].children[groupName].result = ReviewResult.APPROVE;
        }
      }
    });
    return map;
  });

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    if (selectedShapeInfo?.instanceId) {
      store.review.setSelectedMissingReview();
    }
  }, [selectedShapeInfo]);

  const getInstance = (instanceId: string) => displayedInstances[instanceId];

  const getGroup = (instanceId: string, groupName: string, frameIndex: number = currentFrame) => {
    const instance = getInstance(instanceId);
    const group = instance?.children.find((g) => g.name === groupName)?.frames[frameIndex];
    return group;
  };

  const getShape = (instanceId: string, groupName: string, id: string | number, frameIndex: number = currentFrame) => {
    const group = getGroup(instanceId, groupName, frameIndex);
    return group && group.shapes && (typeof id === 'number' ? (group.shapes as Points)[id] : (group.shapes as CurrentShapes)[id]);
  };

  const setInstance = (id: string, instance?: InstanceAct) => {
    setInstances({
      ...instances,
      [id]: instance!
    });
  };

  const setShape = (frameIndex: number, instanceId: string, groupName: string, id: number | string, shapeType: LandmarkEditType, shape?: Point | Rectangle) => {
    const instance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
    if (instance) {
      let group = instance.children.find((g) => g.name === groupName);
      let currentGroup = group?.frames[frameIndex];
      if (!group) {
        group = {
          name: groupName,
          shapeType,
          count: 0,
          frames: {
            [frameIndex]: {
              frameIndex,
              count: 0,
              shapes: {}
            }
          }
        };
        instance.children.push(group);
        currentGroup = group.frames[frameIndex];
      } else if (!currentGroup) {
        group.frames[frameIndex] = {
          frameIndex,
          count: 0,
          shapes: {}
        };
        currentGroup = group.frames[frameIndex];
      }
      if (currentGroup !== undefined && !currentGroup.shapes) {
        currentGroup.shapes = {};
      }
      let oldShape: Point | Rectangle | undefined;
      if (shapeType === LandmarkEditType.KEYPOINT) {
        oldShape = ((currentGroup as Frame).shapes as Points)[id as number];
      } else if (shapeType === LandmarkEditType.RECTANGLE) {
        oldShape = ((currentGroup as Frame).shapes as CurrentShapes)[id];
      }

      if (!shape && oldShape) {
        group.count = group.count ? group.count - 1 : 0;
        (currentGroup as Frame).count = (currentGroup as Frame).count ? (currentGroup as Frame).count - 1 : 0;
        instance.notEmpty = (instance.notEmpty || 0) - 1;
        if (shapeType === LandmarkEditType.KEYPOINT) {
          delete ((currentGroup as Frame).shapes as Points)[id as number];
        } else {
          delete ((currentGroup as Frame).shapes as CurrentShapes)[id];
        }
      } else if (shape) {
        if (!oldShape) {
          instance.notEmpty = (instance.notEmpty || 0) + 1;
          group.count = group.count ? group.count + 1 : 1;
          (currentGroup as Frame).count = (currentGroup as Frame).count ? (currentGroup as Frame).count + 1 : 1;
        }
        (currentGroup as Frame).shapes = {
          ...(currentGroup as Frame).shapes,
          [id]: shape
        };
      }
      setInstance(instanceId, instance);
      const groupInfo = store.ontology.getGroupData(instance.category, groupName);
      if (groupInfo?.label_config && (currentGroup as Frame).count === groupInfo.count && !(currentGroup as Frame).attributes) {
        handleFormConfig(groupInfo.label_config, {}, { instanceId, category: instance.category, groupName });
      }
    }
  };

  const updateStatus = async (curr: Status[], prev: Status[]) => {
    let newUpdatedShapes: UpdatedShape[] = [];
    let newUpdatedCategories: KeypointCategoryProps[] = [];
    let updatedHandles: HandleStatus[] = [];
    const newCategoryPathShapes = cloneDeep(categoryPathShapes);
    for (let m = 0; m < prev.length; m += 1) {
      const item = prev[m];
      if (item.type === 'shape') {
        const { frameIndex, instanceId, groupName, category, index, id, shapeType } = item.status;
        const frameGroup: FrameGroup = { frameIndex, instanceId, category, groupName };
        let keyObj: { id: string } | { index: number } | undefined;
        if (shapeType === LandmarkEditType.KEYPOINT && index !== undefined) {
          keyObj = { index };
        } else if (shapeType === LandmarkEditType.RECTANGLE && id !== undefined) {
          keyObj = { id };
        }
        if (keyObj) {
          setShape(frameIndex, instanceId, groupName, Object.values(keyObj)[0], shapeType);
          newUpdatedShapes.push({ ...frameGroup, ...keyObj, shapeType });
        }
      } else if (item.type === 'pointCategory-path-shape') {
        if (item.status.shape) {
          delete newCategoryPathShapes[item.status.pointCategory];
        }
      } else if (item.type === 'instance') {
        const { id, instance } = item.status;
        if (instance) {
          const { updateShapes } = getFrameShapes([instance], currentFrame, true);
          newUpdatedShapes = [
            ...newUpdatedShapes,
            ...updateShapes
          ];
          const instanceIndex = instanceIds.findIndex((v) => v === id);
          if (instanceIndex >= 0) {
            setInstance(id);
            const selectedIndex = instanceIndex - 1;
            const newInstance = instances[instanceIds[selectedIndex]];
            if (newInstance) {
              selectGroup(newInstance.id, newInstance.children[0].name, false);
            } else {
              selectGroup('', '', false);
            }
          }
        }
      } else if (item.type === 'group') {
        const { instanceId, frameIndex, groupName, attributes } = item.status;
        if (attributes) {
          const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
          const newGroup = newInstance?.children.find((v) => v.name === groupName);
          if (newInstance && newGroup) {
            (newGroup.frames[frameIndex] as Frame).attributes = undefined;
            setInstance(instanceId, newInstance);
          }
        }
      } else if (item.type === 'reviews') {
        store.review.setInitialData(item.status);
      }
    };
    for (let n = 0; n < curr.length; n += 1) {
      const item = curr[n];
      if (item.type === 'handle') {
        updatedHandles = item.status;
      } else if (item.type === 'shape') {
        const { instanceId, groupName, category, index, id, shapeType, shape, frameIndex } = item.status;
        const frameGroup: FrameGroup = { frameIndex, instanceId, category, groupName };
        if (shape) {
          if (shapeType === LandmarkEditType.KEYPOINT && index !== undefined) {
            const point = shape as Point;
            const { pointCategory, isKeyPoint, visible, attributes } = point;
            setShape(frameIndex, instanceId, groupName, index, shapeType, point);
            const updateIndex = newUpdatedShapes.findIndex((p) => p.instanceId === instanceId && p.groupName === groupName && p.index === index);
            const updateShape: Point = {
              pointCategory,
              isKeyPoint,
              visible,
              ...(point.position && {
                position: { ...point.position },
              }),
              attributes
            };
            if (updateIndex >= 0) {
              newUpdatedShapes[updateIndex].shape = updateShape;
            } else {
              newUpdatedShapes.push({ ...frameGroup, index, shape: updateShape, shapeType });
            }
          } else if (shapeType === LandmarkEditType.RECTANGLE && id !== undefined) {
            const rectangle = shape as Rectangle;
            const { displayColor, visible, x, y, width, height } = rectangle;
            setShape(frameIndex, instanceId, groupName, id, LandmarkEditType.RECTANGLE, rectangle);
            const updateRectangle: Rectangle = {
              id,
              x,
              y,
              width,
              height,
              displayColor,
              visible,
            };
            const updateIndex = newUpdatedShapes.findIndex((rect) => rect.instanceId === instanceId && rect.groupName === groupName && rect.id === id);
            if (updateIndex >= 0) {
              newUpdatedShapes[updateIndex].shape = updateRectangle;
            } else {
              newUpdatedShapes.push({ ...frameGroup, id, shape: updateRectangle, shapeType });
            }
          }
        }
      } else if (item.type === 'pointCategory-path-shape') {
        const { frameIndex, pointCategory, shape } = item.status;
        const keys = pointCategory.split('_');
        newUpdatedCategories.push({
          frameIndex,
          instanceId: keys[1],
          groupName: keys[2],
          category: instances[keys[1]].category,
          pointCategory: keys[3],
        });
        if (shape) {
          newCategoryPathShapes[pointCategory] = shape;
        }
      } else if (item.type === 'instance') {
        const { id, instance } = item.status;
        if (instance) {
          setInstance(id, instance);
          selectGroup(instance.id, instance.children[0].name, false);
          const { updateShapes, updatedCategories: newCategories } = getFrameShapes([instance], currentFrame);
          newUpdatedShapes = [
            ...newUpdatedShapes,
            ...updateShapes
          ];
          newUpdatedCategories = [
            ...newUpdatedCategories,
            ...newCategories
          ];
        }
      } else if (item.type === 'group') {
        const { instanceId, groupName, attributes, frameIndex } = item.status;
        const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
        const newGroup = newInstance?.children.find((v) => v.name === groupName);
        if (newInstance && newGroup) {
          Object.keys(newGroup.frames[frameIndex].shapes).forEach((id) => {
            const attrLayer = canvas.current?.getAttrLabelByKey(instanceId, groupName, id);
            if (attrLayer) {
              canvas.current?.updateAttributeLabel(instanceId, newInstance.category, groupName, id, attributes);
            }
          });
          (newGroup.frames[frameIndex] as Frame).attributes = attributes;
          setInstance(instanceId, newInstance);
        }
      } else if (item.type === 'reviews') {
        store.review.setInitialData(item.status);
      }
    };
    await setCategoryPathShapes(newCategoryPathShapes);
    await setUpdatedCategories(newUpdatedCategories);
    store.shape.setUpdatedShapes(newUpdatedShapes);
    store.handle.setUpdatedHandles(updatedHandles);
  };

  const handleUndo = () => {
    if (!store.undo.undoDisabled && !isReview) {
      const item = store.undo.undo();
      if (item && item.before) {
        updateStatus(item.before, item.after);
        notification.success({ message: 'Undo successfully.' });
      }
    }
  };

  const handleRedo = () => {
    if (!store.undo.redoDisabled && !isReview) {
      const item = store.undo.redo();
      if (item && item.after) {
        updateStatus(item.after, item.before);
        notification.success({ message: 'Redo successfully.' });
      }
    }
  };

  const handleChangeDrawMode = (mode: boolean) => {
    if (store.review.isEditable) {
      canvas.current?.clearHits();
      if (mode) {
        setNextEmptyShape();
      } else {
        const { instanceId, category, groupName } = selectedShapeStatus;
        setSelectedShape(undefined, { instanceId, category, groupName });
      }
      store.review.setDrawMode(mode);
    }
  };

  const loadInitialData = async () => {
    let data;
    const { initial_result: initialResult } = props;
    if (initialResult) {
      try {
        data = await fetchResultByUrl(initialResult);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Fetch data from ${initialResult} error:`, e);
      }
    }
    return data;
  };

  const addInstance = async (ontologyName: string) => {
    const ontologyItem = store.ontology.ontology.find((category) => category.class_name === ontologyName);
    if (ontologyItem) {
      const id = uuid();
      const sameOntologyInstances = instanceList.filter((v) => v.category === ontologyName).reverse();
      const number = sameOntologyInstances.length ? sameOntologyInstances[0].number + 1 : 1;

      const children = ontologyItem.children.map((v) => ({
        name: v.name,
        shapeType: v.type,
        count: 0,
        frames: {
          [currentFrame]: {
            frameIndex: currentFrame,
            count: 0,
            shapes: {}
          }
        }
      }));
      const instance = {
        id,
        number,
        displayColor: ontologyItem.display_color,
        notEmpty: 0,
        category: ontologyItem.class_name,
        children
      };
      setDefaultInstances({ [id]: instance });
      await handleInstanceChange({ [id]: instance });
      if (ontologyItem.children && ontologyItem.children.length > 0) {
        selectGroup(id, ontologyItem.children[0].name, false, { category: ontologyName, shapeType: ontologyItem.children[0].type });
      }
    }
  };

  const addInstanceInFrame = (instanceId: string, groupName?: string) => {
    const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
    if (newInstance) {
      if (groupName) {
        const groupIdx = newInstance.children.findIndex((group) => group.name === groupName);
        if (groupIdx >= 0) {
          let copyFrame: Frame | undefined;
          Object.keys(newInstance.children[groupIdx].frames).forEach((i) => {
            const index = Number(i);
            const frame = { ...newInstance.children[groupIdx].frames[index] };
            frame.shapes = { ...frame.shapes };
            if (frame?.count && frame.count > 0) {
              if (index < currentFrame) {
                copyFrame = frame;
              } else if (index > currentFrame && copyFrame === undefined) {
                copyFrame = frame;
              }
            }
          });
          if (copyFrame !== undefined) {
            newInstance.children[groupIdx].frames[currentFrame] = {
              ...copyFrame,
              frameIndex: currentFrame
            };
            newInstance.children[groupIdx].count += copyFrame.count;
            newInstance.notEmpty += copyFrame.count;
          }
        }
      } else {
        let copyFrameIdx: number | undefined;
        Object.keys(instancesFrames[instanceId]).forEach((i) => {
          const index = Number(i);
          if (index < currentFrame) {
            copyFrameIdx = index;
          } else if (index > currentFrame && copyFrameIdx === undefined) {
            copyFrameIdx = index;
          }
        });
        if (copyFrameIdx !== undefined) {
          newInstance.children.forEach((group) => {
            const copyFrame = { ...group.frames[copyFrameIdx as number] };
            copyFrame.shapes = { ...copyFrame.shapes };
            if (copyFrame) {
              group.count += copyFrame.count;
              newInstance.notEmpty += group.count;
              group.frames[currentFrame] = {
                ...copyFrame,
                frameIndex: currentFrame
              };
            }
          });
        }
      }
      const { updateShapes, updatedCategories: newUpdatedCategories } = getFrameShapes([newInstance], currentFrame);
      handleInstanceChange({ [instanceId]: newInstance });
      setUpdatedCategories(newUpdatedCategories);
      store.shape.setUpdatedShapes(updateShapes);
    }
  };

  const removeInstanceFrames = (type: DELETETYPE, instance: InstanceAct, name?: string) => {
    if (instance) {
      let delShapes: UpdatedShape[] = [];
      const newInstance = cloneDeep(instance);
      const update = (updateInstance: InstanceAct, frameIndex: number) => {
        updateInstance.children.forEach((group) => {
          if ((name && name === group.name) || !name) {
            if (group.frames[frameIndex] !== undefined) {
              group.count -= (group.frames[frameIndex] as Frame).count;
              delete group.frames[frameIndex];
            }
          }
        });
      };
      if (type === DELETETYPE.CURRENT) {
        const { updateShapes } = getFrameShapes([instance], currentFrame, true);
        delShapes = updateShapes;
        update(newInstance, currentFrame);
      } else if (type === DELETETYPE.FOLLOW || type === DELETETYPE.ALL) {
        const diffFrame = type === DELETETYPE.FOLLOW ? currentFrame : 0;
        Array.from({ length: frames.length - diffFrame }).forEach((_, i) => {
          const frameIndex = i + diffFrame;
          const { updateShapes } = getFrameShapes([instance], frameIndex, true);
          delShapes = [
            ...delShapes,
            ...updateShapes
          ];
          update(newInstance, frameIndex);
        });
      }
      if (name) {
        delShapes = delShapes.filter((v) => v.groupName === name);
      }
      newInstance.notEmpty -= delShapes.length;
      store.shape.setUpdatedShapes(delShapes);
      handleInstanceChange({ [newInstance.id]: newInstance });
    }
  };

  const handleInstanceChange = async (
    newInstances: { [id: string]: InstanceAct },
    status?: { before: Status[], after: Status[] }
  ) => {
    const ids = Object.keys(newInstances);
    const before: Status[] = status ? status.before : [];
    const after: Status[] = status ? status.after : [];
    if (ids.length > 0) {
      ids.forEach(async (id) => {
        const oldInstance = instances[id] ? cloneDeep(instances[id]) : undefined;
        let isRemove = true;
        newInstances[id].children.forEach((child) => {
          if (Object.keys(child.frames).length > 0) {
            isRemove = false;
          }
        });
        before.push({
          type: 'instance',
          status: {
            frameIndex: currentFrame,
            id,
            instance: oldInstance,
          }
        });
        after.push({
          type: 'instance',
          status: {
            frameIndex: currentFrame,
            id,
            instance: isRemove ? undefined : newInstances[id]
          }
        });
        setInstance(id, isRemove ? undefined : newInstances[id]);
      });
    }
    store.undo.saveStatus(before, after);
  };

  const onLoad = async () => {
    setLoading(true);
    setReadOnly(isPreview(props.jobProxy.toolMode));

    // i18n
    i18n.setLocale(props.locale);

    // init payload
    await store.init(props);

    let result;
    let initialData: any;
    let initInstancesData;
    try {
      result = await props.jobProxy.loadResult();
      initialData = await loadInitialData();
    } catch (e) {
      notification.error({ message: formatMessage('ANNOTATION_DATA_LOAD_ERROR'), duration: null });
      return;
    }

    // parse frames
    const framesData = await parseFramesByPaylod({ frames: props.image, imageData: result?.images as Image[] });
    // preload image
    setImagePreloader(loader(framesData.map((v) => v.url)));
    // set frame images
    setFrames(framesData);

    if (result) {
      if (Array.isArray(result)) {
        // legacy data
        if (result[0] && result[0].position) {
          initInstancesData = initInstances(result, framesData.length);
        } else {
          initInstancesData = result;
        }
      }
      if (result.auditId) {
        props.jobProxy.setAuditId(result.auditId);
      }
      if (result.instances) {
        initInstancesData = result.instances;
      } else if (result.points) {
        initInstancesData = initInstances(result.points, framesData.length);
      }
      // if (Array.isArray(result.handles)) {
      //   store.handle.init(result.handles);
      // }

      if (result.categoryPathShapes) {
        const newCategoryPathShapes: { [categoryKey: string]: CategoryPathShape } = {};
        result.categoryPathShapes.forEach(({ pointCategory, shape }: { pointCategory: string; shape: CategoryPathShape }) => {
          newCategoryPathShapes[pointCategory] = shape;
        });
        setCategoryPathShapes(newCategoryPathShapes);
      }
      setImageSize({
        width: result.width,
        height: result.height,
      });
    }

    // load reviews
    // await loadReviews();
    if (initialData) {
      if (initialData.categoryPathShapes) {
        const initialCategoryPathShapesData: { [key: string]: CategoryPathShape } = {};
        initialData.categoryPathShapes.forEach(({ pointCategory, shape }: { pointCategory: string; shape: CategoryPathShape }) => {
          initialCategoryPathShapesData[pointCategory] = shape;
        });
        setInitialCategoryPathShapes(initialCategoryPathShapesData);
      }
      let initialInstancesData;
      if (initialData.instances) {
        initialInstancesData = initialData.instances;
      } else if (initialData.points) {
        initialInstancesData = initInstances(result.points, framesData.length);
      }
      const { newInstances, categoryInstancesMap: newCategoryInstancesMap } = loadInstancesFromResult(initialInstancesData);
      setInitialInstances(newInstances);
      setInitialCategoryInstancesMap(newCategoryInstancesMap);
    }
    let currentInstances: { [id: string]: InstanceAct } = {};
    if (Array.isArray(initInstancesData) && initInstancesData.length > 0) {
      const { newInstances } = loadInstancesFromResult(initInstancesData);
      await setDefaultInstances(newInstances);
      await setInstances(newInstances);
      currentInstances = newInstances;
    }
    setLoading(false);
    setFrame(0, currentInstances);
    saverRef.current?.setTempSaved(true);
    // render completed
    props.renderComplete();
  };

  /**
   * set current frame
   * @param frame
   */
  const setFrame = async (frameIndex: number, currentInstances: { [id: string]: InstanceAct } | undefined = instances, type?: CANVASSTATUS) => {
    if (frameIndex === currentFrame && type !== CANVASSTATUS.INITIAL) {
      return;
    }
    store.review.cancelUnfinishMissingReview();
    const currentInstanceList = Object.values(currentInstances);
    canvas.current?.cleanLayer();
    canvas.current?.setMultiShapesUnselected();
    imagePreloader?.preload(frameIndex);
    await setCurrentFrame(frameIndex);
    let currentShapeStatus = {
      ...selectedShapeStatus,
      frameIndex,
    };
    if (!currentShapeStatus.groupName && currentInstanceList.length > 0) {
      const { id, category, children: [{ name }] } = currentInstanceList[0];
      const group = store.ontology.getGroupData(category, name);
      currentShapeStatus = {
        ...currentShapeStatus,
        instanceId: id,
        category,
        groupName: name,
        shapeType: group?.type,
      };
      setSelectedOntologyGroup(name);
    }
    setSelectedShapeStatus(currentShapeStatus);
    const { updateShapes, updatedCategories: updatedCategoriesData } = getFrameShapes(currentInstanceList, frameIndex);
    setUpdatedCategories(updatedCategoriesData);
    store.shape.setUpdatedShapes(updateShapes);
    store.handle.changeFrame(frameIndex);
  };

  /**
   * set visible review data
   */
  const setReview = async () => {
    if (initialInstances && Object.keys(initialInstances).length > 0) {
      const newIsReview = !isReview;
      const displayInstances = newIsReview ? initialInstances : instances || {};
      await setDefaultInstances(displayInstances);
      setFrame(currentFrame, displayInstances, CANVASSTATUS.INITIAL);
      setIsReview(newIsReview);
    }
  };

  const onSave = async (submit = true) => {
    if (loading) {
      const loadError = formatMessage('ERROR_DATA_LOAD');
      notification.error({ message: loadError });
      throw new Error(loadError);
    }

    saverRef.current?.disableLeaveCheck();

    const checkMissingPoints = props.check_missing_points === true && submit === true;
    const newInstances: InstanceListItem[] = instanceList.filter((v) => v && v.notEmpty).map((instance) => {
      const { id, category, number, displayColor, children } = instance;
      const ontologyInfo = store.ontology.getOntologyInfo(category);
      return {
        id,
        category,
        number,
        displayColor,
        children: children.map((group) => {
          const { frames: groupFrames } = group;
          return {
            ...group,
            frames: Object.values(groupFrames).filter((v) => !!v && v.count > 0).map((frameGroup) => {
              if (frameGroup) {
                const { frameIndex, count, shapes: groupShapes } = frameGroup;
                const groupInfo = store.ontology.getGroupData(instance.category, group.name);
                const newShapes: PointListItem[] | Rectangle[] = [];
                if (groupShapes) {
                  Object.keys(groupShapes).forEach((key) => {
                    if (group.shapeType === LandmarkEditType.KEYPOINT) {
                      const pointIndex = parseInt(key, 10);
                      const point: PointListItem | undefined = groupShapes && (groupShapes as Points)[pointIndex];
                      if (point) {
                        point.index = pointIndex;
                        (newShapes as PointListItem[]).push(point);
                      }
                    } else if (group.shapeType === LandmarkEditType.RECTANGLE) {
                      const rectangle: Rectangle | undefined = groupShapes && (groupShapes as CurrentShapes)[key];
                      if (rectangle) (newShapes as Rectangle[]).push(rectangle);
                    }
                  });
                }
                if (
                  checkMissingPoints &&
                  frames[frameIndex].valid !== false &&
                  groupInfo &&
                  newShapes.length < groupInfo.count
                ) {
                  const errMsg = formatMessage('ERROR_INCOMPLETE', {
                    values: {
                      frameIndex: frameIndex + 1,
                      class_name: ontologyInfo?.display_name || ontologyInfo?.class_name,
                      index: `${instance.number}`,
                      name: group.name,
                      annotated: `${count}`,
                      total: `${groupInfo.count}`
                    }
                  });
                  notification.error({ message: errMsg });
                  throw new Error(errMsg);
                }
                return {
                  ...frameGroup,
                  shapes: newShapes
                };
              }
              return undefined;
            })
          };
        })
      };
    });
    const statData = getInstanceStatistics();
    const statistics = await props.jobProxy.saveResultStat(statData);
    const handles = store.handle.getHandles();
    return props.jobProxy.saveResult({
      auditId: props.jobProxy.auditId,
      width: canvas.current?.imageCanvas?.width || imageSize?.width,
      height: canvas.current?.imageCanvas?.height || imageSize?.height,
      instances: newInstances,
      handles,
      categoryPathShapes: Object.keys(categoryPathShapes).map((pointCategory) => ({
        pointCategory,
        shape: categoryPathShapes[pointCategory],
      })),
      images: frames,
      statistics,
    }, submit);
  };

  /**
   * get review statistics
   */
  const getStatistics = () => {
    const statShapes: {
      [shape: string]: { rejected: number; approved: number, suspended: number, missed: number, total: number };
    } = {};
    const objects = {
      total: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
      missed: 0,
    };
    const reviews = store.review.reviews.filter((r) => r.result !== ReviewResult.APPROVE);
    const instancesList = Object.values(instances).filter((v) => !!v);
    for (let i = 0; i < instancesList.length; i += 1) {
      const instance = instancesList[i];
      for (let j = 0; j < instance.children.length; j += 1) {
        const item = instance.children[j];
        const shape = item.shapeType;
        const itemFrames = Object.values(item.frames);
        for (let k = 0; k < itemFrames.length; k += 1) {
          const frame = itemFrames[k];
          if (!statShapes[shape]) {
            statShapes[shape] = {
              rejected: 0,
              approved: 0,
              suspended: 0,
              missed: 0,
              total: 0
            };
          }
          const frameReviews = reviews.filter((r) => r.frameIndex === frame.frameIndex && r.instanceId === instance.id && r.groupName === item.name);
          const frameShapes = Object.keys(frame.shapes);
          for (let l = 0; l < frameShapes.length; l += 1) {
            statShapes[shape].total += 1;
            objects.total += 1;
            const shapeId = shape === LandmarkEditType.KEYPOINT ? Number(frameShapes[l]) : frameShapes[l];
            const review = frameReviews.find((r) => r.shapeIds.indexOf(shapeId) >= 0);
            if (review?.result === ReviewResult.REJECT) {
              statShapes[shape].rejected += 1;
              objects.rejected += 1;
            } else if (review?.result === ReviewResult.SUSPEND) {
              statShapes[shape].suspended += 1;
              objects.suspended += 1;
            } else {
              statShapes[shape].approved += 1;
              objects.approved += 1;
            }
          }
        }
      }
    }
    return { objects, shapes: statShapes };
  };

  /**
   * get instance statistics
   */
  const getInstanceStatistics = () => {
    const { ontology } = store.ontology;
    const data: Statistic = {
      elements: [],
      categories: ontology.map(({ class_name: className }) => className),
      shapes: new Set(),
      summary: {},
      frameCount: frames.length,
      annotatedFrames: new Set(),
    };

    const instancesList = Object.values(instances).filter((v) => !!v);
    for (let i = 0; i < instancesList.length; i += 1) {
      const { id, category, children } = instancesList[i];
      for (let j = 0; j < children.length; j += 1) {
        const item = children[j];
        const itemFrames = Object.values(item.frames);
        for (let k = 0; k < itemFrames.length; k += 1) {
          const frame = itemFrames[k];
          const frameShapes = Object.values(frame.shapes);
          const shape = item.shapeType;
          data.shapes.add(shape);
          const key = `${shape}_${category}`;
          if (!data.summary[key]) {
            data.summary[key] = {
              ids: [],
              category,
              shape,
              count: 0,
              distinctCount: 0,
            };
          }
          const shapeCount = frameShapes.length;
          if (shapeCount > 0) {
            data.summary[key].count += shapeCount;
            if (!data.summary[key].ids.includes(id)) {
              data.summary[key].distinctCount += shapeCount;
              data.summary[key].ids.push(id);
            }
            data.annotatedFrames.add(frame.frameIndex);
            data.elements.push(
              ...frameShapes.map((s) => ({
                instance: id,
                shape,
                frame: frame.frameIndex + 1,
                category,
                id: s.id || s.index,
              }))
            );
          }
        }
      }
    }

    return {
      ...data,
      shapes: Array.from(data.shapes),
      summary: Object.values(data.summary).map(({ category, shape, count, distinctCount }) => ({
        category,
        shape,
        count,
        distinctCount,
      })),
      annotatedFrames: Array.from(data.annotatedFrames),
      annotatedFrameCount: data.annotatedFrames.size,
    };
  };

  const loadReviews = async () => {
    const reviews = await props.jobProxy.loadReviews();
    store.review.setInitialData(reviews);
  };

  const saveReviews = (type = 'submit') => {
    if (type === 'submit') {
      const hasSuspend = store.review.reviews.find((review) => review.result === ReviewResult.SUSPEND);
      if (hasSuspend) {
        throw new Error(formatMessage('QC_SUSPEND_ERROR'));
      }
    }
    saverRef.current?.disableLeaveCheck();
    const reviews = toJS(store.review.reviews).map((r) => {
      const { instanceId: id, groupName, shapeIds } = r;
      const instance = getInstance(id);
      const ontologyItem = store.ontology.getOntologyInfo(instance?.category);
      const groupItem = ontologyItem && ontologyItem.children && ontologyItem.children.find((group) => group.name === groupName);
      const label = ontologyItem && instance ?
        `${ontologyItem.display_name || ''}${instance.number}${groupItem ? `-${groupItem.display_name}` : ''}${shapeIds && shapeIds.length && (typeof shapeIds[0] === 'number') ? `[${shapeIds.join(',')}]` : ''}` :
        'Deleted';
      return { ...r, label };
    });
    const missingReviews = toJS(store.review.missingReviews).map((r) => ({
      ...r,
      label: 'Missed',
    }));
    return props.jobProxy.saveReviews([...reviews, ...missingReviews], type === 'submit');
  };

  const handleSave = async () => {
    const { toolMode } = props.jobProxy;
    if (isPreview(toolMode)) {
      return;
    }

    try {
      if (!isAnnotationReadonly(toolMode)) {
        await onSave(false);
      }
      if (store.review.isEnabled) {
        await saveReviews('save');
      }
      notification.success({ message: formatMessage('SAVE_SUCCESS') });
    } catch (e) {
      notification.error({ message: formatMessage('SAVE_FAIL') });
    }
  };

  const setSelectedShape = (id?: number | string, groupData?: Group) => {
    let newSelectedShapeStatus = cloneDeep(selectedShapeStatus);
    newSelectedShapeStatus.id = id;
    if (groupData) {
      const { instanceId, category, groupName, shapeType } = groupData;
      if (instanceId !== selectedInstance?.id) {
        selectGroup(instanceId, groupName, false);
      } else if (groupName !== selectedOntologyGroup) {
        setSelectedOntologyGroup(groupName);
      }
      newSelectedShapeStatus = {
        ...newSelectedShapeStatus,
        instanceId,
        category,
        shapeType: shapeType || ontologyGroup?.type || undefined,
        groupName,
      };
    }
    setSelectedShapeStatus(newSelectedShapeStatus);
  };

  const setNextEmptyShape = (shapeStatus: ShapeInfo = selectedShapeStatus) => {
    if (shapeStatus) {
      let { id } = shapeStatus;
      const { instanceId, groupName, shapeType } = shapeStatus;
      if (shapeType === LandmarkEditType.KEYPOINT) {
        let categoryScannedCount = 0;
        let categoryIndex = selectedCategoryIndex >= 0 ? selectedCategoryIndex : 0;
        id = shapeStatus.id;
        while (categories.length > 0 && categoryScannedCount <= categories.length) {
          const { range = [] } = categories[categoryIndex];
          if (id === undefined || id === -1) {
            id = range[0] - 1;
          }
          if (id !== range[1]) {
            (id as number) += 1;
          } else {
            categoryIndex = categoryIndex < categories.length - 1 ? categoryIndex + 1 : 0;
            categoryScannedCount += 1;
            id = categories[categoryIndex].range[0] || 0;
          }
          if (!instanceId || getShape(instanceId, groupName, id!) === undefined) {
            break;
          }
        }
      } else if (ontologyGroup) {
        id = undefined;
      }
      setSelectedShapeStatus({
        ...shapeStatus,
        id
      });
    }
  };

  const onCategoriesUpdated = () => {
    setUpdatedCategories([]);
  };

  const handleShapesChange = (
    newShapes: UpdatedShape[],
    groupsAttributes?: { instanceId: string, category: string, name: string, attributes: any }[],
    status?: { before: Status[], after: Status[] }
  ) => {
    if (newShapes.length === 0) {
      return;
    }
    const before: Status[] = status ? status.before : [];
    const after: Status[] = status ? status.after : [];
    const { instanceId, groupName } = newShapes[0];
    const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
    const groupInfo = store.ontology.getGroupData(newInstance?.category || '', groupName);
    newInstance?.children.forEach((child) => {
      if (child.name === groupName) {
        if (!child.frames[currentFrame]) {
          child.frames[currentFrame] = {
            frameIndex: currentFrame,
            count: 0,
            shapes: {},
          };
        };
        const currentGroup = child.frames[currentFrame];
        for (let i = 0; i < newShapes.length; i += 1) {
          const { id, frameIndex, index, shape } = newShapes[i];
          let oldShape;

          if (child.shapeType === LandmarkEditType.KEYPOINT && typeof index === 'number') {
            oldShape = (child.frames[frameIndex].shapes as Points)[index];
            (child.frames[frameIndex].shapes as Points)[index] = {
              ...oldShape,
              ...shape as Point
            };
          } else if (child.shapeType === LandmarkEditType.RECTANGLE && typeof id === 'string') {
            oldShape = (child.frames[frameIndex].shapes as CurrentShapes)[id];
            (child.frames[frameIndex].shapes as CurrentShapes)[id] = {
              ...oldShape,
              ...shape as Rectangle
            };
          }

          if (!shape && oldShape) {
            child.count = child.count ? child.count - 1 : 0;
            currentGroup.count = currentGroup.count ? currentGroup.count - 1 : 0;
            newInstance.notEmpty = (newInstance.notEmpty || 0) - 1;
          } else if (shape && !oldShape) {
            child.count = child.count ? child.count + 1 : 1;
            currentGroup.count = currentGroup.count ? currentGroup.count + 1 : 1;
            newInstance.notEmpty = (newInstance.notEmpty || 0) + 1;
          }
        };
        if (groupInfo?.label_config && currentGroup.count === groupInfo?.count && !currentGroup.attributes) {
          handleFormConfig(groupInfo.label_config, {}, { instanceId, category: newInstance.category, groupName });
        }
      }
    });
    if (groupsAttributes && groupsAttributes.length > 0) {
      groupsAttributes.forEach(({ instanceId: id, name, category, attributes }) => {
        const frameGroup: FrameGroup = { frameIndex: currentFrame, instanceId: id, category, groupName: name };
        before.push({ type: 'group', status: { ...frameGroup } });
        after.push({ type: 'group', status: { ...frameGroup, attributes } });
      });
    }
    if (newInstance) {
      handleInstanceChange({ [instanceId]: newInstance }, { before, after });
    } else {
      store.undo.saveStatus(before, after);
    }
  };

  const handleShapesRemove = (removeShapes: UpdatedShape[]) => {
    if (removeShapes.length === 0) {
      return;
    }

    const changeInstances: { [id: string]: InstanceAct } = {};
    const { instanceId, groupName } = removeShapes[0];
    const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
    if (newInstance) {
      newInstance?.children.forEach((child) => {
        if (child.name === groupName) {
          const currentGroup = child.frames[currentFrame];
          removeShapes.forEach(({ id, frameIndex, index }) => {
            if (child.shapeType === LandmarkEditType.KEYPOINT && typeof index === 'number') {
              delete (child.frames[frameIndex].shapes as Points)[index];
            } else if (child.shapeType === LandmarkEditType.RECTANGLE && typeof id === 'string') {
              delete (child.frames[frameIndex].shapes as CurrentShapes)[id];
            }
            child.count = child.count ? child.count - 1 : 0;
            currentGroup.count = currentGroup.count ? currentGroup.count - 1 : 0;
            newInstance.notEmpty = (newInstance.notEmpty || 0) - 1;
          });
        }
      });
      changeInstances[instanceId] = newInstance;
      handleInstanceChange({ [instanceId]: newInstance });
    }
  };

  const togglePointsVisibility = (points: PointStatus[]) => {
    const list: UpdatedShape[] = [];
    points.forEach(({ instanceId, category, groupName, index }) => {
      const point = getShape(instanceId, groupName, index);
      if (point) {
        list.push({
          frameIndex: selectedShapeStatus.frameIndex,
          instanceId,
          category,
          groupName,
          index,
          shapeType: LandmarkEditType.KEYPOINT,
          shape: { ...point, visible: !point.visible }
        });
      }
    });
    handleShapesChange(list);
  };

  const setCategoryPathShape = (categoryKey: string, shapeType?: CategoryPathShape, _updatedShapes?: UpdatedShape[]) => {
    const before: Status[] = [{
      type: 'pointCategory-path-shape',
      status: { frameIndex: selectedShapeStatus.frameIndex, pointCategory: categoryKey, shape: categoryPathShapes[categoryKey] },
    }];
    const after: Status[] = [{
      type: 'pointCategory-path-shape',
      status: { frameIndex: selectedShapeStatus.frameIndex, pointCategory: categoryKey, shape: shapeType },
    }];
    const newCategoryPathShapes = cloneDeep(categoryPathShapes);
    if (shapeType && _updatedShapes) {
      newCategoryPathShapes[categoryKey] = shapeType;
      handleShapesChange(_updatedShapes, undefined, { before, after });
    } else {
      delete newCategoryPathShapes[categoryKey];
      store.undo.saveStatus(before, after);
    }
    setCategoryPathShapes(newCategoryPathShapes);
  };

  const selectGroup = (id: string, groupName: string, isFit = true, groupData?: { category: string, shapeType: LandmarkEditType }) => {
    const instance = isReview ? initialInstances[id] : instances[id];
    const newSelectedShapeStatus: ShapeInfo = {
      frameIndex: currentFrame,
      instanceId: id,
      category: groupData?.category || selectedShapeStatus.category,
      groupName,
      shapeType: groupData?.shapeType || undefined,
      id: undefined
    };
    if (instance) {
      const ontologyItem = store.ontology.ontology.find((v) => v.class_name === instance.category);
      const group = ontologyItem?.children.find((v) => v.name === groupName);
      newSelectedShapeStatus.category = instance.category;
      newSelectedShapeStatus.shapeType = group?.type || undefined;
      if (isDrawMode) {
        if (group?.type === LandmarkEditType.KEYPOINT) {
          const index = (group.categories && group.categories[0] && group.categories[0].range[0]) || 0;
          // set selected to the empty
          newSelectedShapeStatus.id = index;
        } else if (group?.type === LandmarkEditType.RECTANGLE) {
          instance.children.forEach((child) => {
            if (child.name === groupName && child.frames[currentFrame]?.shapes) {
              const rectangles = child.frames[currentFrame].shapes;
              newSelectedShapeStatus.id = Object.keys(rectangles)[0];
            }
          });
        }
      }
      canvas.current?.updateGroupBox(id, instance.category, groupName);
      if (isFit) {
        canvas.current?.fitSelected(id, groupName);
      }
    }
    setSelectedShapeStatus(newSelectedShapeStatus);
    setSelectedOntologyGroup(groupName);
  };

  const editShapeForm = () => {
    const { instanceId, groupName, shapeType, id, category } = selectedShapeStatus;
    if (shapeType === LandmarkEditType.KEYPOINT) {
      const point = getShape(instanceId, groupName, (id as number));
      const currentOntologyGroup = store.ontology.getGroupData(category, groupName);
      if (point && currentOntologyGroup?.point_label_config) {
        handleFormConfig(currentOntologyGroup.point_label_config, (point as Point).attributes || {}, { instanceId, category, groupName }, (id as number), point);
      }
    }
  };

  const editGroupForm = () => {
    const { instanceId, groupName, category } = selectedShapeStatus;
    const group = getGroup(instanceId, groupName);
    const currentOntologyGroup = store.ontology.getGroupData(category, groupName);
    if (group && currentOntologyGroup?.label_config) {
      handleFormConfig(currentOntologyGroup.label_config, group.attributes || {}, { instanceId, category, groupName });
    }
  };

  const handleFormConfig = (config: FormConfig, values: { [attr: string]: any; }, group: Group, index?: number, point?: Point) => {
    setFormConfig(config);
    setFormValues(values);
    setEditFormObject({
      ...group,
      index,
      point,
    });
    let title = getShapeLabel(group.instanceId, group.category, group.groupName) || formatMessage('EDIT_ATTRIBUTES');
    if (index !== undefined) {
      title = `${title} [${index}]`;
    }
    attributesRef.current?.showModal(title);
  };

  const getShapeLabel = (instanceId: string, category: string, groupName: string) => {
    let title = '';
    if (displayedInstances) {
      const instance = instances[instanceId];
      const groupData = store.ontology.getGroupData(category, groupName);
      if (instance && groupData) {
        title = `${formatMessage('VALIDATION_FRAME', { values: { frameIndex: currentFrame + 1 } })}${groupData.class_display_name || ''}${instance.number || ''}-${groupData.display_name || groupData.name}`;
      }
    }
    return title;
  };

  const setAttributes = (values: any) => {
    if (editFormObject) {
      const { instanceId, category, groupName, index, point } = editFormObject;
      const before: Status[] = [];
      const after: Status[] = [];
      const frameGroup: FrameGroup = { frameIndex: currentFrame, instanceId, category, groupName };
      if ((index || index === 0) && point) {
        const oldPoint = getShape(instanceId, groupName, index);
        const newPoint = { ...oldPoint, ...point, attributes: values };
        setShape(currentFrame, instanceId, groupName, index, LandmarkEditType.KEYPOINT, newPoint);
        before.push({ type: 'shape', status: { ...frameGroup, index, shape: oldPoint, shapeType: LandmarkEditType.KEYPOINT } });
        after.push({ type: 'shape', status: { ...frameGroup, index, shape: newPoint, shapeType: LandmarkEditType.KEYPOINT } });
        canvas.current?.updateAttributeLabel(instanceId, category, groupName, index, values);
      } else {
        const newInstance = instances[instanceId] ? cloneDeep(instances[instanceId]) : undefined;
        const newGroup = newInstance?.children.find((v) => v.name === groupName)?.frames[currentFrame];
        const oldGroup = getGroup(instanceId, groupName);
        const ontologyChild = store.ontology.getGroupData(category, groupName);
        if (newInstance && newGroup && ontologyChild) {
          const oldAttrs = oldGroup?.attributes;
          newGroup.attributes = values;
          setInstance(instanceId, newInstance);
          before.push({ type: 'group', status: { ...frameGroup, attributes: oldAttrs } });
          after.push({ type: 'group', status: { ...frameGroup, attributes: values } });
          if (oldGroup?.shapes) {
            if (ontologyChild.type === LandmarkEditType.RECTANGLE) {
              Object.keys(oldGroup.shapes).forEach((id) => {
                canvas.current?.updateAttributeLabel(instanceId, category, groupName, id, values, newInstance.number);
              });
            }
          }
        }
      }
      if (before.length > 0) {
        store.undo.saveStatus(before, after);
      }
    }
    setFormConfig(null);
    setFormValues(null);
    setEditFormObject(null);
  };

  /**
   * set active attributes mode
   * @param activeMode
   * @param type point or object
   */
  const onAttributesModeChanges = (activeMode: AttributesMode, type = 'object') => {
    canvas.current?.updatelabelVisible(activeMode, type);
  };

  const onSizeChange = () => {
    canvas.current?.resizeShapes();
  };

  const onFilterChange = () => {
    canvas.current?.updateFilters();
  };

  const onLabelModeChange = () => {
    if (canvas.current?.labelLayer) {
      canvas.current.labelLayer.visible = store.setting.labelMode;
    }
  };

  const onGridVisibleChange = () => {
    if (canvas.current?.gridLayer) {
      canvas.current.gridLayer.visible = store.setting.isGridVisible;
    }
  };

  const setFrameValid = (frame: number, valid: boolean) => {
    const newFramesData = cloneDeep(frames);
    newFramesData[frame].valid = valid;
    setFrames(newFramesData);
  };

  useImperativeHandle(ref, () => ({
    onSave,
    saveReviews,
    getStatistics,
  }));

  return (
    <Observer>
      {() => (
        <div className="landmark-annotation-app">
          <AutoSaver
            ref={saverRef}
            leaveCheck
            data={{ instance: instances, reviews: store.review.qaWarnings }}
            save={handleSave}
          />
          <Toolbar
            readonly={readonly || loading || isReview}
            isReview={isReview}
            isPreview={readonly}
            initialDataLength={Object.keys(initialInstances).length}
            onAttributesModeChanges={onAttributesModeChanges}
            onSizeChange={onSizeChange}
            onFilterChange={onFilterChange}
            onLabelModeChange={onLabelModeChange}
            onGridVisibleChange={onGridVisibleChange}
            onSave={handleSave}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            setReview={setReview}
            handleChangeDrawMode={handleChangeDrawMode}
          />
          <div
            className="container"
            style={{
              height: `calc(100% - ${(frames.length > 1 && currentFrame >= 0) ? `${frameControlHeight + 35}px` : '35px'})`,
              transition: 'height 0.15s',
            }}
          >
            <TabMenu
              tabs={[
                {
                  title: formatMessage('MENU_INSTANCE'),
                  key: 'instance',
                  count: 0,
                  content: (
                    <SideMenus
                      canvas={canvas.current}
                      readonly={readonly || loading || isReview || !isDrawMode}
                      loading={loading}
                      instances={instanceList}
                      currentFrame={currentFrame}
                      instancesFrames={instancesFrames}
                      selectedInstance={selectedInstance}
                      selectedOntologyGroup={selectedOntologyGroup}
                      instancesReviewsMap={instancesReviewsMap}
                      addInstance={addInstance}
                      selectGroup={selectGroup}
                      addInstanceInFrame={addInstanceInFrame}
                      removeInstanceFrames={removeInstanceFrames}
                    />
                  )
                },
                {
                  title: formatMessage('MENU_WARNING'),
                  key: 'validator',
                  count: store.review.warnings.length,
                  content: (
                    <Validator
                      canvas={canvas.current}
                      ref={validatorRef}
                      instances={instances}
                      jobProxy={props.jobProxy}
                      warnings={store.review.warnings || []}
                      setFrame={setFrame}
                      setSelectedShape={setSelectedShape}
                      selectGroup={selectGroup}
                      getInstance={getInstance}
                      saveResult={() => onSave(false)}
                    />
                  )
                }
              ]}
            />
            {selectedInstance && ontologyGroup && !isReview && (
              <Board
                categories={categories}
                categoryPathShapes={displayedCategoryPathShapes}
                points={shapes}
                ontologyGroup={ontologyGroup}
                selectedShapeStatus={selectedShapeStatus}
                annotated={annotatedPointOrShapeCount}
                total={totalPointCount}
                drawMode={isDrawMode}
                setSelectedShape={(id) => {
                  const { instanceId, category, groupName } = selectedShapeStatus;
                  setSelectedShape(id, { instanceId, category, groupName });
                }}
                frameControlHeight={frameControlHeight}
                readonly={loading}
                instanceReviewsMap={store.review.frameReviewsMap[currentFrame]}
              />
            )}
            <Canvas
              ref={canvas}
              readonly={readonly}
              loading={loading}
              isReview={isReview}
              currentFrame={currentFrame}
              image={frames[currentFrame]?.url}
              categories={categories}
              selectedInstance={selectedInstance}
              selectedGroupName={selectedOntologyGroup}
              ontologyGroup={ontologyGroup}
              annotatedPointOrShapeCount={annotatedPointOrShapeCount}
              updatedCategories={updatedCategories}
              defaultInstances={defaultInstances}
              selectedShapeStatus={selectedShapeStatus}
              selectedShapeInfo={selectedShapeInfo}
              changeLoading={setLoading}
              selectGroup={selectGroup}
              setSelectedShape={setSelectedShape}
              handleShapesChange={handleShapesChange}
              onCategoriesUpdated={onCategoriesUpdated}
              handleShapesRemove={handleShapesRemove}
              togglePointsVisibility={togglePointsVisibility}
              setNextEmptyShape={setNextEmptyShape}
              editShapeForm={editShapeForm}
              editGroupForm={editGroupForm}
              onSave={handleSave}
              getInstance={getInstance}
              categoryPathShapes={displayedCategoryPathShapes}
              setCategoryPathShape={setCategoryPathShape}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              setReview={setReview}
              handleChangeDrawMode={handleChangeDrawMode}
            />
            <div className="arributes-panel">
              {selectedShapeStatus.groupName && (
                <Information
                  pointCategory={(categories[selectedCategoryIndex] || {}).name}
                  point={selectedShapeStatus}
                  annotated={annotatedPointOrShapeCount}
                  total={totalPointCount}
                />
              )}
              {frames[currentFrame]?.url && (
                <FrameAttributes
                  currentFrame={currentFrame}
                  currentFrameValid={frames[currentFrame].valid}
                  setFrameValid={setFrameValid}
                />
              )}
            </div>
            <Attributes
              ref={attributesRef}
              readonly={readonly || isReview || !isDrawMode}
              config={formConfig}
              values={formValues}
              onValuesChange={setAttributes}
            />
          </div>
          {(frames.length > 1 && currentFrame >= 0) && (
            <FrameControl
              frames={frames}
              frameLoading={loading}
              currentFrame={currentFrame}
              categoryInstancesMap={displayedCategoryInstancesMap}
              instancesReviewsMap={instancesReviewsMap}
              instances={displayedInstances}
              selectedInstance={selectedInstance}
              selectedInstanceGroup={selectedOntologyGroup}
              selectGroup={selectGroup}
              setFrame={setFrame}
              onHeightChange={setFrameControlHeight}
            />
          )}
          {store.review.selectedReview && (
            <QualityControl
              review={store.review.selectedReview}
              readonly={readonly || isDrawMode}
              jobProxy={props.jobProxy}
              selectedShapeStatus={selectedShapeStatus}
              getShapeLabel={getShapeLabel}
            />
          )}
          <Missing
            readonly={readonly || isDrawMode}
            jobProxy={props.jobProxy}
          />
        </div>
      )}
    </Observer>
  );
});

export default LandmarkAnnotation;
