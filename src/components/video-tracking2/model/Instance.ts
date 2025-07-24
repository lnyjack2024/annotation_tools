import { makeAutoObservable, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';
import InstanceItem from './InstanceItem';
import { InstanceItem as IInstanceItem, Instance as IInstance, Category, DynamicAttributes, InstanceDynamicAttributes } from '../types';

interface InstanceOptions {
  id?: string;
  categoryRef: Category;
  number: number;
  attributes?: any;
  dynamicAttributes?: InstanceDynamicAttributes[];
  items?: IInstanceItem[];
  getNextShapeOrder?: (frameIndex: number, camera: string) => number;
}

/**
 * Instance
 * @class
 */
export default class Instance {
  /**
   * instance uuid
   * @member
   */
  id: string;

  /**
   * category instance reference
   * @member
   */
  categoryRef: Category;

  /**
   * instance number
   * @member
   */
  number: number;

  /**
   * instance attributes
   * @member
   */
  attributes?: any;

  /**
 * instance dynamic attributes
 * @member
 */
  dynamicAttributes?: {
    [camera: string]: {
      [frameIndex: number]: DynamicAttributes;
    }
  };


  /**
   * instance items
   * @member
   */
  items: { [itemId: string]: InstanceItem } = {};

  /**
   * is instance selected
   * @member
   */
  selected = false;

  /**
   * is instance collapsed
   * @member
   */
  collapsed = false;

  /**
   * get next shape order
   * @member
   */
  getNextShapeOrder?: (frameIndex: number, camera: string) => number;

  /**
   * instance category class name
   * @getter
   */
  get category() {
    return this.categoryRef.className;
  }

  /**
   * instance label
   * @getter
   */
  get label() {
    return `${this.categoryRef.displayName}${this.number}`;
  }

  /**
   * instance frame status (merged status)
   * @getter
   */
  get frameStatus() {
    // simple merge
    return Object.values(this.items)
      .map((i) => i.frameStatus)
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  /**
   * instance existed camera names
   * @getter
   */
  get existedCameras() {
    const cameras = new Set(Object.values(this.items).flatMap((i) => i.existedCameras));
    return Array.from(cameras);
  }

  /**
   * is instance empty in all camera & frames
   * @getter
   */
  get isEmpty() {
    return Object.values(this.items).every((item) => item.isEmpty);
  }

  /**
   * is instance only contains one item
   * @getter
   */
  get isSingle() {
    const { children } = this.categoryRef;
    return children.length === 1 && children[0].count === 1;
  }

  constructor({ id, categoryRef, number, attributes, dynamicAttributes, items = [], getNextShapeOrder }: InstanceOptions) {
    makeAutoObservable(this, {
      id: false,
      categoryRef: false,
      isEmpty: false,
      isSingle: false,
      getNextShapeOrder: false,
    }, {
      autoBind: true,
    });

    this.getNextShapeOrder = getNextShapeOrder;
    this.id = id || uuidv4();
    this.categoryRef = categoryRef;
    this.number = number;
    this.attributes = cloneDeep(attributes);
    this.setDynamicAttributes(dynamicAttributes);
    items.forEach((item) => this.createItemFromData(item));
  }

  /**
   * create instance item from structured instance item data
   * @param instanceItem
   */
  createItemFromData(instanceItem: IInstanceItem) {
    const { children } = this.categoryRef;
    const categoryItem = children.find((c) => c.name === instanceItem.name);
    if (categoryItem) {
      const item = new InstanceItem({
        id: instanceItem.id,
        instance: this,
        categoryItemRef: categoryItem,
        number: instanceItem.number,
        cameras: instanceItem.cameras,
      });
      this.items[item.id] = item;
    }
  }

  /**
   * get instance items by instance item name
   * @param instanceItemName
   */
  getItemsByName(instanceItemName: string) {
    return toJS(Object.values(this.items).filter((i) => i.name === instanceItemName));
  }

  /**
   * get instance item by name & number
   * @param instanceItemName
   * @param instanceItemNumber
   */
  getItem(instanceItemName: string, instanceItemNumber: number) {
    const items = Object.values(this.items);
    return items.find((i) => i.name === instanceItemName && i.number === instanceItemNumber);
  }

  /**
   * set selected
   * @param selected
   */
  setSelected(selected: boolean) {
    this.selected = selected;
  }

  /**
   * set collasped
   * @param collapsed
   */
  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
  }

  /**
   * set attributes
   * @param attributes
   */
  setAttributes(attributes: any) {
    this.attributes = cloneDeep(attributes);
  }

  /**
 * set dynamic attributes
 * @param attrs
 */
  setDynamicAttributes = (attrs: any) => {
    if (Array.isArray(attrs)) {
      const dynamicAttributes: {
        [camera: string]: {
          [frameIndex: number]: DynamicAttributes;
        }
      } = {};
      attrs.forEach((cameraItem) => {
        const { camera, frames } = cameraItem || {};
        if (camera) {
          dynamicAttributes[camera] = {};
          if (Array.isArray(frames)) {
            frames.forEach((frameItem) => {
              const { frameIndex, attributes } = frameItem;
              dynamicAttributes[camera][frameIndex] = {
                frameIndex,
                attributes,
              };
            });
          }
        }
      });
      this.dynamicAttributes = dynamicAttributes;
    };
  };

  /**
   * set dynamic attributes
   * @param camera
   * @param updatedDynamicAttributes
   */
  setDynamicAttributesByCamera(camera: string, updatedDynamicAttributes: DynamicAttributes[]) {
    for (let i = 0; i < updatedDynamicAttributes.length; i += 1) {
      const { frameIndex, attributes } = updatedDynamicAttributes[i];
      if (attributes) {
        if (!this.dynamicAttributes) {
          this.dynamicAttributes = {};
        }
        if (!this.dynamicAttributes[camera]) {
          this.dynamicAttributes[camera] = {};
        }
        if (!this.dynamicAttributes[camera][frameIndex]) {
          this.dynamicAttributes[camera][frameIndex] = { frameIndex };
        };
        this.dynamicAttributes[camera][frameIndex].attributes = cloneDeep(attributes);
      }
    }
  }

  instanceDynamicAttrNeedDelete(camera: string, instanceItemId: string) {
    const instanceItemHasCameraData = Object.values(this.items).filter((item) => item.cameras?.[camera] && item.id !== instanceItemId);
    if (instanceItemHasCameraData && instanceItemHasCameraData.length > 0) {
      return false;
    }
    return true;
  }

  /**
   * delete dynamic attributes by camera 、frames、instanceItemId
   * @param camera
   * @param frames
   * @param instanceItemId
   */
  deleteDynamicAttributesByCamera(camera: string, frames: number[], instanceItemId: string) {
    if (this.dynamicAttributes?.[camera]) {
      frames.forEach((frameIndex) => {
        const needDelete = this.instanceDynamicAttrNeedDelete(camera, instanceItemId);
        if (needDelete && !this.items[instanceItemId]?.cameras?.[camera]?.frames?.[frameIndex]) {
          delete this.dynamicAttributes![camera][frameIndex];
          if (Object.keys(this.dynamicAttributes![camera]).length === 0) {
            delete this.dynamicAttributes![camera];
          }
          if (Object.keys(this.dynamicAttributes!).length === 0) {
            this.dynamicAttributes = undefined;
          }
        }
      });
    }
  }

  /**
   * remove item
   * @param instanceItemId
   */
  removeItem(instanceItemId: string) {
    delete this.items[instanceItemId];
  }

  /**
   * destroy
   */
  destroy() {
    // remove references
    this.items = {};
  }

  dynamicAttributesJSON(): InstanceDynamicAttributes[] | undefined {
    if (!this.dynamicAttributes) {
      return undefined;
    }
    const cameras = Object.keys(this.dynamicAttributes);
    return cameras.map((camera) => {
      const frames = Object.values(this.dynamicAttributes![camera]).map(({ frameIndex, attributes }) => ({
        frameIndex,
        attributes: cloneDeep(toJS(attributes)),
      }));
      return {
        camera,
        frames,
      };
    });
  }

  /**
   * return structured data
   */
  toJSON(): IInstance {
    return {
      ...this.getBasicInfo(),
      children: Object.values(this.items)
        .filter((item) => !item.isEmpty)
        .map((item) => item.toJSON()),
    };
  }

  /**
   * return basic info data
   */
  getBasicInfo() {
    return {
      id: this.id,
      category: this.category,
      categoryName: this.categoryRef.displayName,
      categoryColor: this.categoryRef.displayColor,
      number: this.number,
      attributes: cloneDeep(toJS(this.attributes)),
      dynamicAttributes: this.dynamicAttributesJSON(),
    };
  }
}
