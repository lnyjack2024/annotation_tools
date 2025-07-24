import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import Instance from '../model/Instance';
import InstanceItem from '../model/InstanceItem';
import { getNextKeyFrames, preciseShapeByType } from '../utils';
import { Instance as IInstance } from '../types';
import { ShapeData, ShapeType } from '../../common/shapes/types';

/**
 * store for instances
 * @class
 */
export default class InstanceStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * all instances
   */
  instances: { [instanceId: string]: Instance } = {};

  /**
   * selected instances
   */
  selectedInstances: Instance[] = [];

  /**
   * selected instance items
   */
  selectedInstanceItems: InstanceItem[] = [];

  /**
   * category instances map
   * @getter
   */
  get categoryInstancesMap() {
    const map: { [categoryName: string]: Instance[] } = {};
    Object.values(this.instances).forEach((instance) => {
      if (!map[instance.category]) {
        map[instance.category] = [];
      }
      map[instance.category].push(instance);
    });
    this.rootStore.ontology.categories.forEach(({ className }) => {
      if (!map[className]) {
        map[className] = [];
      } else {
        map[className].sort((a, b) => a.number - b.number);
      }
    });
    return map;
  };

  /**
   * all instances sorted by timeline
   * @getter
   */
  get allInstances() {
    const { categories } = this.rootStore.ontology;
    return Object.values(this.instances)
      .sort((a, b) => {
        const instanceAFirstFrame = Number(Object.keys(a.frameStatus)[0]);
        const instanceBFirstFrame = Number(Object.keys(b.frameStatus)[0]);
        if (instanceAFirstFrame > instanceBFirstFrame) {
          return 1;
        }
        if (instanceAFirstFrame < instanceBFirstFrame) {
          return -1;
        }
        const instanceACategoryIndex = categories.findIndex((c) => c.className === a.category);
        const instanceBCategoryIndex = categories.findIndex((c) => c.className === b.category);
        if (instanceACategoryIndex > instanceBCategoryIndex) {
          return 1;
        }
        if (instanceACategoryIndex < instanceBCategoryIndex) {
          return -1;
        }
        return a.number > b.number ? 1 : -1;
      });
  }

  /**
   * multiple instance item selected
   * @getter
   */
  get isMultiSelected() {
    return this.selectedInstances.length > 1 || this.selectedInstanceItems.length > 1;
  }

  /**
   * single instance item selected
   */
  get isSingleSelected() {
    return this.selectedInstances.length === 1 && this.selectedInstanceItems.length === 1;
  }

  /**
   * does selected instance has label config to set attributes
   * @getter
   */
  get selectedInstanceAttributesEnabled() {
    if (this.isMultiSelected || this.selectedInstances.length <= 0) {
      return false;
    }

    const selectedInstance = this.selectedInstances[0];
    const selectedInstanceItem = this.selectedInstanceItems.length === 1 ? this.selectedInstanceItems[0] : undefined;
    return this.isAttributesEnabled(selectedInstance, selectedInstanceItem);
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * init instances
   * @param instances
   */
  async init(instances: IInstance[]) {
    const { getCategory } = this.rootStore.ontology;
    const { cameraNames, updateNextShapeOrder } = this.rootStore.frame;
    const categoryNumbers: { [category: string]: number[] } = {};
    const numberDuplicatedInstances: IInstance[] = [];
    instances.forEach((instance) => {
      const category = getCategory(instance.category);
      if (category) {
        instance.children.forEach((instanceItem) => {
          const categoryItem = category.children.find((c) => c.name === instanceItem.name);
          if (categoryItem) {
            instanceItem.cameras.forEach((cameraData) => {
              if (cameraNames.includes(cameraData.camera)) {
                cameraData.frames.forEach((frameData) => {
                  // fix shape data precision
                  preciseShapeByType(frameData.shapeType, frameData.shape);
                  // update next shape order
                  if (typeof frameData.order === 'number' && frameData.order >= 0) {
                    updateNextShapeOrder(frameData.order, frameData.frameIndex, cameraData.camera);
                  }
                });
              } else {
                cameraData.frames = [];
              }
            });
            instanceItem.cameras = instanceItem.cameras.filter((c) => c.frames.length > 0); // remove invalid camera data
          } else {
            instanceItem.cameras = [];
          }
        });
        instance.children = instance.children.filter((i) => i.cameras.length > 0); // remove invalid instance item data
        if (instance.children.length > 0) {
          if (!categoryNumbers[category.className]) {
            categoryNumbers[category.className] = [];
          }
          const checkNumbers = categoryNumbers[category.className];
          if (this.rootStore.annotatable && checkNumbers.indexOf(instance.number) >= 0) {
            // number already exists, fix number later
            numberDuplicatedInstances.push(instance);
          } else {
            categoryNumbers[category.className].push(instance.number);
            this.createInstanceFromData(instance);
          }
        }
      }
    });
    numberDuplicatedInstances.forEach((instance) => {
      const number = this.rootStore.instance.getNextInstanceNumber(instance.category);
      instance.number = number;
      this.createInstanceFromData(instance);
    });
  }

  /**
   * create instance from structured instance data
   * @param instance
   */
  createInstanceFromData(instance: IInstance) {
    const category = this.rootStore.ontology.getCategory(instance.category);
    if (category) {
      const newInstance = new Instance({
        id: instance.id,
        categoryRef: category,
        number: instance.number,
        attributes: instance.attributes,
        dynamicAttributes: instance.dynamicAttributes,
        items: instance.children,
        getNextShapeOrder: this.rootStore.frame.getNextShapeOrder,
      });
      this.instances[newInstance.id] = newInstance;
    }
  }

  /**
   * is instance dynamic attributes enable
   * @param instance
   */
  // eslint-disable-next-line class-methods-use-this
  isInstanceDynamicAttributesEnabled(instance: Instance) {
    // selected instance has label config setting
    return !!instance.categoryRef.labelConfigDynamic;
  }

  /**
   * is instance item attributes enabled
   * @param instanceItem
   */
  isInstanceItemAttributesEnabled(instanceItem: InstanceItem) {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const cameraData = instanceItem.cameras[currentCamera];
    if (cameraData) {
      const frameData = cameraData.frames[currentFrame];
      if (frameData) {
        if (instanceItem.categoryItemRef.labelConfig) {
          // instance item has label config setting
          return true;
        }
      }
    }
    return false;
  };

  /**
   * is instance & instance item attributes enabled
   * @param instance
   * @param instanceItem
   */
  isAttributesEnabled(instance: Instance, instanceItem?: InstanceItem) {
    const instanceDynamicAttributesEnabled = this.isInstanceDynamicAttributesEnabled(instance);
    if (instanceDynamicAttributesEnabled) {
      return true;
    }
    if (instanceItem) {
      return this.isInstanceItemAttributesEnabled(instanceItem);
    }
    return Object.values(instance.items).some((item) => this.isInstanceItemAttributesEnabled(item));
  }

  /**
   * get instance by id
   * @param instanceId
   */
  getInstanceById(instanceId: string) {
    return this.instances[instanceId];
  }

  /**
   * get next instance number
   * @param categoryName
   */
  getNextInstanceNumber(categoryName: string) {
    const categoryInstanceNumbers = (this.categoryInstancesMap[categoryName] || []).map((i) => i.number);
    return Math.max(...categoryInstanceNumbers, 0) + 1;
  }

  /**
   * get next instance item number
   * @param instanceId
   * @param categoryItemName
   * @param camera
   */
  getNextInstanceItemNumber(instanceId: string, categoryItemName: string, camera = this.rootStore.frame.currentCamera) {
    const instance = this.instances[instanceId];
    const items = Object.values(instance.items).filter((i) => i.name === categoryItemName);
    const itemsInCamera = items.filter((i) => {
      const cameraData = i.cameras[camera];
      return cameraData && !cameraData.isEmpty;
    });
    const itemNumbers = itemsInCamera.map((i) => i.number);
    return Math.max(...itemNumbers, 0) + 1;
  }

  /**
   * update selected instance
   * @param instance
   */
  updateSelectedInstance(instance: Instance | Instance[]) {
    const instances = Array.isArray(instance) ? instance : [instance];
    this.selectedInstances.forEach((i) => {
      if (instances.indexOf(i) < 0) {
        i.setSelected(false);
      }
    });
    this.selectedInstances = [...instances];
    this.selectedInstances.forEach((i) => {
      i.setSelected(true);
    });
  }

  /**
   * update selected instance item
   * @param instanceItem
   */
  updateSelectedInstanceItem(instanceItem: InstanceItem | InstanceItem[]) {
    const instanceItems = Array.isArray(instanceItem) ? instanceItem : [instanceItem];
    this.selectedInstanceItems.forEach((i) => {
      if (instanceItems.indexOf(i) < 0) {
        i.setSelected(false);
      }
    });
    this.selectedInstanceItems = [...instanceItems];
    this.selectedInstanceItems.forEach((i) => {
      i.setSelected(true);
    });
  }

  /**
   * select instance
   * @param instance
   * @param autoFocus
   */
  selectInstance(instance?: Instance | Instance[] | null, autoFocus = false) {
    const instances = Array.isArray(instance) ? instance : [...instance ? [instance] : []];
    this.updateSelectedInstance(instances);

    if (instances.length > 0) {
      // select category if needed
      const allCategories = instances.map((i) => i.category);
      if (allCategories.indexOf(this.rootStore.ontology.selectedCategoryName) < 0) {
        this.rootStore.ontology.selectCategory(allCategories[0]);
      }

      // filter selected instance item
      const instanceItems: InstanceItem[] = this.selectedInstanceItems.filter((i) => instances.indexOf(i.instance) >= 0);

      // if the instance is single, default select first instance item
      if (this.rootStore.frame.isSingleCamera) {
        instances.forEach((i) => {
          if (i.isSingle && Object.keys(i.items).length > 0) {
            const item = Object.values(i.items)[0];
            if (instanceItems.indexOf(item) < 0) {
              instanceItems.push(item);
            }
          }
        });
      }
      this.updateSelectedInstanceItem(instanceItems);
    } else {
      this.updateSelectedInstanceItem([]);
    }

    // update shape selection
    this.rootStore.shape.selectShapeByInstanceItem(this.selectedInstanceItems);
    this.rootStore.shape.updateShapesInInstance(instances);
    if (autoFocus) {
      this.rootStore.shape.fitShapes();
    }
  }

  /**
   * select instance item
   * @param instanceItem
   * @param autoFocus
   */
  selectInstanceItem(instanceItem?: InstanceItem | InstanceItem[] | null, autoFocus = false) {
    const instanceItems = Array.isArray(instanceItem) ? instanceItem : [...instanceItem ? [instanceItem] : []];
    this.updateSelectedInstanceItem(instanceItems);
    const instanceSet = new Set(instanceItems.map((i) => i.instance));
    const instances = Array.from(instanceSet);
    this.selectInstance(instances, autoFocus);
  }

  /**
   * get current editing instance item
   */
  getCurrentInstanceItem(
    currentCategoryName = this.rootStore.ontology.selectedCategoryName,
    currentCategoryItemName = this.rootStore.ontology.selectedCategoryItemName
  ) {
    const selectedInstance = this.selectedInstances.find((i) => i.category === currentCategoryName) || this.selectedInstances[0];
    if (selectedInstance && selectedInstance.category === currentCategoryName) {
      const selectedInstanceItems = this.selectedInstanceItems.filter((i) => i.instance === selectedInstance);
      const selectedInstanceItem = selectedInstanceItems.find((i) => i.name === currentCategoryItemName) || selectedInstanceItems[0];
      if (selectedInstanceItem && selectedInstanceItem.name === currentCategoryItemName) {
        // has selected instance item
        const { currentCamera, currentFrame } = this.rootStore.frame;
        const { frames } = selectedInstanceItem.cameras[currentCamera];
        if (!frames[currentFrame]) {
          // not exist in current frame
          return selectedInstanceItem;
        }
      }

      const category = this.rootStore.ontology.getCategoryItem(currentCategoryName, currentCategoryItemName);
      if (category) {
        const { currentCamera } = this.rootStore.frame;
        const { name, count } = category;
        // find items exist in current camera
        const items = selectedInstance.getItemsByName(name).filter((i) => {
          const cameraData = i.cameras[currentCamera];
          return cameraData && !cameraData.isEmpty;
        });
        if (count !== undefined && items.length < count) {
          return this.createInstanceItem(selectedInstance, currentCategoryItemName);
        }
      }
    }

    // return a new instance
    const instance = this.createInstance(currentCategoryName);
    return this.createInstanceItem(instance!, currentCategoryItemName);
  }

  /**
   * create instance
   * @param categoryName
   */
  createInstance(categoryName = this.rootStore.ontology.selectedCategory.className) {
    const category = this.rootStore.ontology.getCategory(categoryName);
    if (category) {
      const instance = new Instance({
        categoryRef: category,
        number: this.getNextInstanceNumber(categoryName),
        getNextShapeOrder: this.rootStore.frame.getNextShapeOrder,
      });
      this.instances[instance.id] = instance;
      return instance;
    }
    return undefined;
  }

  /**
   * create instance item
   * @param instance
   * @param categoryItem
   */
  createInstanceItem(instance: Instance, categoryItem = this.rootStore.ontology.selectedCategoryItem.name) {
    const number = this.getNextInstanceItemNumber(instance.id, categoryItem);
    const existItem = instance.getItem(categoryItem, number);
    if (existItem) {
      return existItem;
    }
    // create
    const { children = [] } = instance.categoryRef;
    const item = children.find((c) => c.name === categoryItem);
    const instanceItem = new InstanceItem({
      instance,
      categoryItemRef: item || children[0],
      number,
    });
    instance.items[instanceItem.id] = instanceItem;
    return instanceItem;
  }

  /**
   * delete instance
   * @param instance
   */
  deleteInstance(instance: Instance | Instance[]) {
    const instances = Array.isArray(instance) ? instance : [instance];
    this.selectedInstances = this.selectedInstances.filter((i) => instances.indexOf(i) < 0);
    this.selectedInstanceItems = this.selectedInstanceItems.filter((i) => instances.indexOf(i.instance) < 0);
    instances.forEach((i) => {
      i.destroy();
      delete this.instances[i.id];
    });
  }

  /**
   * delete instance item
   * @param instanceItem
   */
  deleteInstanceItem(instanceItem: InstanceItem | InstanceItem[]) {
    const instanceItems = Array.isArray(instanceItem) ? instanceItem : [instanceItem];
    this.selectedInstanceItems = this.selectedInstanceItems.filter((i) => instanceItems.indexOf(i) < 0);
    instanceItems.forEach(({ id, instance }) => {
      instance.removeItem(id);
    });
  }

  /**
   * delete frames from instance item
   * @param instanceItem
   * @param frames
   * @param camera
   */
  deleteFramesFromInstanceItem = (
    instanceItem: InstanceItem,
    frames: number[],
    camera = this.rootStore.frame.currentCamera,
  ) => {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const prevBasicInfo = instanceItem.instance.getBasicInfo();
    if (camera === currentCamera && frames.includes(currentFrame)) {
      // remove shape
      this.rootStore.shape.deleteShapeByInstanceItem(instanceItem);
    }

    const { prevState, currState } = instanceItem.remove(camera, frames);
    const basicInfo = instanceItem.instance.getBasicInfo();
    this.rootStore.undo.push({
      instances: prevState ? [{ ...prevBasicInfo, children: [prevState] }] : [],
    }, {
      instances: currState ? [{ ...basicInfo, children: [currState] }] : [],
    });

    if (instanceItem.isEmpty) {
      this.deleteInstanceItem(instanceItem);
    }
    if (instanceItem.instance.isEmpty) {
      this.deleteInstance(instanceItem.instance);
    }
  };

  /**
   * delete frames from instance items
   * @param instanceItems
   */
  deleteFramesFromInstanceItems = (instanceItems: { instanceItem: InstanceItem, frames: number[], camera?: string }[]) => {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const prevInstanceMap: { [instanceId: string]: IInstance } = {};
    const currInstanceMap: { [instanceId: string]: IInstance } = {};
    for (let i = 0; i < instanceItems.length; i += 1) {
      const { instanceItem, frames, camera = currentCamera } = instanceItems[i];
      const { instance } = instanceItem;
      const { id: instanceId } = instance;

      if (camera === currentCamera && frames.includes(currentFrame)) {
        // remove shape
        this.rootStore.shape.deleteShapeByInstanceItem(instanceItem);
      }
      const prevInstanceBasicInfo = instance.getBasicInfo();
      const { prevState, currState } = instanceItem.remove(camera, frames);
      if (prevState) {
        if (!prevInstanceMap[instanceId]) {
          prevInstanceMap[instanceId] = {
            ...prevInstanceBasicInfo,
            children: [],
          };
        }
        prevInstanceMap[instanceId].children.push(prevState);
      }
      if (currState) {
        if (!currInstanceMap[instanceId]) {
          currInstanceMap[instanceId] = {
            ...instance.getBasicInfo(),
            children: [],
          };
        }
        currInstanceMap[instanceId].children.push(currState);
      }

      if (instanceItem.isEmpty) {
        this.deleteInstanceItem(instanceItem);
      }
      if (instance.isEmpty) {
        this.deleteInstance(instance);
      }
    }
    this.rootStore.undo.push({
      instances: Object.values(prevInstanceMap),
    }, {
      instances: Object.values(currInstanceMap),
    });
  };

  deleteInstanceItemByFrame = (
    instanceItem: InstanceItem,
    frame: number,
    camera = this.rootStore.frame.currentCamera,
  ) => {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const prevInstanceBasicInfo = instanceItem.instance.getBasicInfo();
    if (camera === currentCamera && frame === currentFrame) {
      // remove shape
      this.rootStore.shape.deleteShapeByInstanceItem(instanceItem);
    }

    const { prevState, currState } = instanceItem.remove(camera, [frame]);

    if (instanceItem.isEmpty) {
      this.deleteInstanceItem(instanceItem);
    }
    if (instanceItem.instance.isEmpty) {
      this.deleteInstance(instanceItem.instance);
    }

    return {
      prevState: {
        instances: prevState ? [{ ...prevInstanceBasicInfo, children: [prevState] }] : [],
      },
      currState: {
        instances: currState ? [{ ...instanceItem.instance.getBasicInfo(), children: [currState] }] : [],
      },
    };
  };

  /**
   * delete frames from instance item by type
   * @param instanceItem
   * @param type
   * @param camera
   */
  deleteFramesFromInstanceItemByType = (
    instanceItem: InstanceItem,
    type: 'current' | 'key' | 'following' | 'all' = 'current',
    camera = this.rootStore.frame.currentCamera,
  ) => {
    const { currentFrame } = this.rootStore.frame;
    switch (type) {
      case 'current':
        this.deleteFramesFromInstanceItem(instanceItem, [currentFrame]);
        break;
      case 'key': {
        const nextKeyFrames = getNextKeyFrames(1, currentFrame, instanceItem.cameras[camera].frames);
        const nextKeyFrame = nextKeyFrames[0];
        if (nextKeyFrame) {
          this.deleteFramesFromInstanceItem(
            instanceItem,
            Array.from({ length: nextKeyFrame - currentFrame }).map((_, index) => currentFrame + index),
          );
        }
        break;
      }
      case 'following': {
        const allFrames = Object.keys(instanceItem.cameras[camera].frames).map((f) => parseInt(f, 10));
        const index = allFrames.indexOf(currentFrame);
        this.deleteFramesFromInstanceItem(
          instanceItem,
          allFrames.slice(index, allFrames.length),
        );
        break;
      }
      case 'all': {
        const allFrames = Object.keys(instanceItem.cameras[camera].frames).map((f) => parseInt(f, 10));
        this.deleteFramesFromInstanceItem(
          instanceItem,
          allFrames,
        );
        break;
      }
      default:
    }
  };

  /**
   * update frame shape info for instance item
   * @param instanceItem
   * @param frameIndex
   * @param shapeType
   * @param shape
   * @param order
   * @param camera
   */
  updateFrameShapeForInstanceItem(instanceItem: InstanceItem, frameIndex: number, shapeType: ShapeType, shape: ShapeData, order?: number, camera = this.rootStore.frame.currentCamera) {
    const prevBasicInfo = instanceItem.instance.getBasicInfo();
    const { prevState, currState } = instanceItem.updateShape(
      camera,
      frameIndex,
      true,
      shapeType,
      shape,
      order,
    );
    const basicInfo = instanceItem.instance.getBasicInfo();
    const instanceState: Record<string, { prev: IInstance, curr: IInstance }> = {
      [basicInfo.id]: {
        prev: { ...prevBasicInfo, children: prevState ? [prevState] : [] },
        curr: { ...basicInfo, children: currState ? [currState] : [] },
      }
    };

    this.rootStore.undo.push({
      instances: Object.values(instanceState).map((i) => i.prev),
    }, {
      instances: Object.values(instanceState).map((i) => i.curr),
    });
  }

  /**
   * update frame shape info for instance items list
   * @param instanceItems
   */
  updateFrameShapeForInstanceItems(instanceItems: { instanceItem: InstanceItem, frameIndex: number, shapeType: ShapeType, shape?: ShapeData, order?: number, camera?: string }[]) {
    const prevInstanceMap: { [instanceId: string]: IInstance } = {};
    const currInstanceMap: { [instanceId: string]: IInstance } = {};
    // const { currentCamera, currentFrame } = this.rootStore.frame;
    for (let i = 0; i < instanceItems.length; i += 1) {
      const { instanceItem, frameIndex, shapeType, shape, order, camera = this.rootStore.frame.currentCamera } = instanceItems[i];
      let state;
      const prevBasicInfo = instanceItem.instance.getBasicInfo();
      if (shape) {
        // update
        state = instanceItem.updateShape(
          camera,
          frameIndex,
          true,
          shapeType,
          shape,
          order,
        );
      } else {
        // delete
        this.rootStore.shape.deleteShapeByInstanceItem(instanceItem);

        state = instanceItem.remove(camera, [frameIndex]);
        if (instanceItem.isEmpty) {
          this.deleteInstanceItem(instanceItem);
        }
        if (instanceItem.instance.isEmpty) {
          this.deleteInstance(instanceItem.instance);
        }
      }

      if (state) {
        const { prevState, currState } = state;
        const { instance } = instanceItem;
        const { id: instanceId } = instance;
        if (prevState) {
          if (!prevInstanceMap[instanceId]) {
            prevInstanceMap[instanceId] = {
              ...prevBasicInfo,
              children: [],
            };
          }
          prevInstanceMap[instanceId].children.push(prevState);
        }
        if (currState) {
          if (!currInstanceMap[instanceId]) {
            currInstanceMap[instanceId] = {
              ...instance.getBasicInfo(),
              children: [],
            };
          }
          currInstanceMap[instanceId].children.push(currState);
        }
      }
    }
    this.rootStore.undo.push({
      instances: Object.values(prevInstanceMap),
    }, {
      instances: Object.values(currInstanceMap),
    });
  }

  /**
   * open attributes modal automatically for selected instance
   */
  autoOpenAttributesModal() {
    if (this.isMultiSelected || this.selectedInstances.length <= 0) {
      return;
    }

    const { currentCamera, currentFrame } = this.rootStore.frame;
    const shouldOpen = (instanceItem: InstanceItem) => {
      const frameData = instanceItem.cameras[currentCamera]?.frames[currentFrame];

      if (
        instanceItem.categoryItemRef.labelConfig &&
        !frameData?.attributes
      ) {
        this.rootStore.config.setAttributesModalVisible(true);
        return true;
      }

      return false;
    };

    if (this.selectedInstanceItems.length === 1) {
      const selectedInstanceItem = this.selectedInstanceItems[0];
      const open = shouldOpen(selectedInstanceItem);
      if (open) {
        this.rootStore.config.setAttributesModalVisible(true);
        return;
      }
    }

    const selectedInstance = this.selectedInstances[0];
    const { labelConfigDynamic } = selectedInstance.categoryRef;
    if (labelConfigDynamic && (!selectedInstance.dynamicAttributes || !selectedInstance.dynamicAttributes[currentCamera]?.[currentFrame]?.attributes)) {
      this.rootStore.config.setAttributesModalVisible(true);
      return true;
    }

    if (this.selectedInstanceItems.length <= 0 && Object.values(selectedInstance.items).some((i) => shouldOpen(i))) {
      // no instance item selected
      this.rootStore.config.setAttributesModalVisible(true);
    }
  }

  /**
   * get instances json data (for save)
   */
  instancesJSON(): IInstance[] {
    return Object.values(this.instances).map((instance) => instance.toJSON());
  }

  /**
   * is current frame attributes
   * @getter
   */
  getCurrentDynamicAttributesByInstance(instance: Instance) {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const { attributes = {} } = instance.dynamicAttributes?.[currentCamera]?.[currentFrame] || {};
    return attributes;
  }
}
