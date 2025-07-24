import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from 'lodash';
import { message } from 'antd';
import RootStore from './RootStore';
import i18n from '../locales';
import { Instance, Review, CameraFrameAttributes } from '../types';
import ReviewItem from '../model/ReviewItem';
import MInstance from '../model/Instance';
import MInstanceItem from '../model/InstanceItem';

const STACK_SIZE = 20;

export interface StoreData {
  // for instances
  instances?: Instance[];
  // for reviews
  reviews?: Review[];
  // for frame attributes
  frames?: CameraFrameAttributes[];
};

interface StoreItem {
  before: StoreData;
  after: StoreData;
}

/**
 * undo & redo store
 * @class
 */
export default class UndoStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * current pointer
   */
  pointer = 0;

  /**
   * last stored data uuid
   */
  lastStoreId = '';

  /**
   * saved status
   */
  stack: StoreItem[] = [];

  /**
   * current data uuid
   */
  storeId = '';

  /**
   * saved data copy
   */
  savedData: StoreData = {};

  /**
   * is undo disabled
   * @getter
   */
  get undoDisabled() {
    return this.pointer <= 0;
  }

  /**
   * is redo disabled
   * @getter
   */
  get redoDisabled() {
    return this.pointer >= this.stack.length;
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      stack: false,
      storeId: false,
      savedData: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * preserve current data
   * @param data
   */
  preserve(data: StoreData = {}) {
    this.storeId = uuidv4();
    this.savedData = cloneDeep(data);
    return this.storeId;
  }

  /**
   * save to stack
   * @param uid
   * @param data
   */
  save(uid: string, data: StoreData = {}) {
    if (uid === this.storeId) { // same command
      this.stack = this.stack.slice(0, this.pointer);
      this.stack.push({
        before: this.savedData,
        after: cloneDeep(data),
      });
      if (this.stack.length > STACK_SIZE) {
        this.stack.shift();
      } else {
        this.pointer += 1;
      }
      this.lastStoreId = uid;
    }
    this.storeId = '';
    this.savedData = {};
  }

  /**
   * push state by prev & curr state
   * @param prevState
   * @param currState
   */
  push(prevState: StoreData, currState: StoreData) {
    this.stack = this.stack.slice(0, this.pointer);
    this.stack.push({
      before: cloneDeep(prevState),
      after: cloneDeep(currState),
    });
    if (this.stack.length > STACK_SIZE) {
      this.stack.shift();
    } else {
      this.pointer += 1;
    }
    this.lastStoreId = uuidv4();
  }

  /**
   * undo
   */
  undo() {
    if (this.undoDisabled || this.rootStore.config.isAnyModalOpened || this.rootStore.shape.isDrawing) {
      return;
    }
    if (this.pointer > 0) {
      this.pointer -= 1;
      const item = this.stack[this.pointer];
      if (item && item.before) {
        this.updateData(item.before, item.after);
        message.success(i18n.translate('UNDO_SUCCESS'));
      }
    }
  }

  /**
   * redo
   */
  redo() {
    if (this.redoDisabled || this.rootStore.config.isAnyModalOpened || this.rootStore.shape.isDrawing) {
      return;
    }
    if (this.pointer < this.stack.length) {
      this.pointer += 1;
      const item = this.stack[this.pointer - 1];
      if (item && item.after) {
        this.updateData(item.after, item.before);
        message.success(i18n.translate('REDO_SUCCESS'));
      }
    }
  }

  /**
   * update data (used for undo / redo)
   * @param curr
   * @param prev
   */
  updateData(curr: StoreData, prev: StoreData) {
    const {
      selectedInstances,
      selectedInstanceItems,
      getInstanceById,
      deleteInstance,
      deleteInstanceItem,
      createInstanceFromData,
    } = this.rootStore.instance;
    const {
      getShapeByInstanceItem,
      deleteShape,
      setupShape,
    } = this.rootStore.shape;
    const {
      currentFrame,
    } = this.rootStore.frame;
    const selectedInstanceMap: { [instanceId: string]: string[] } = {};
    selectedInstances.forEach((instance) => {
      selectedInstanceMap[instance.id] = selectedInstanceItems.filter((i) => i.instance === instance).map((i) => i.id);
    });

    prev.instances?.forEach((affectedInstance) => {
      if (affectedInstance) {
        const instance = getInstanceById(affectedInstance.id);
        if (instance) {
          affectedInstance.children.forEach((affectedItem) => {
            const item = instance.items[affectedItem.id];
            if (item) {
              affectedItem.cameras.forEach((affectedCamera) => {
                const camera = item.cameras[affectedCamera.camera];
                if (camera) {
                  // delete frame
                  affectedCamera.frames.forEach((affectedFrame) => {
                    if (affectedFrame.frameIndex === currentFrame) {
                      // remove shapes if needed
                      const shape = getShapeByInstanceItem(item, camera.camera);
                      if (shape) {
                        deleteShape(shape);
                      }
                    }
                    // delete frame data
                    delete camera.frames[affectedFrame.frameIndex];
                  });
                  // delete camera if needed
                  if (camera.isEmpty) {
                    delete item.cameras[camera.camera];
                  }
                  // delete instance item if needed
                  if (item.isEmpty) {
                    deleteInstanceItem(item);
                  }
                  // delete instance if needed
                  if (instance.isEmpty) {
                    deleteInstance(instance);
                  }
                }
              });
            }
          });
        }
      }
    });
    curr.instances?.forEach((affectedInstance) => {
      if (affectedInstance) {
        const instance = getInstanceById(affectedInstance.id);
        if (instance) {
          instance.attributes = cloneDeep(affectedInstance.attributes);
          instance.setDynamicAttributes(affectedInstance.dynamicAttributes);
          affectedInstance.children.forEach((affectedItem) => {
            const item = instance.items[affectedItem.id];
            if (item) {
              affectedItem.cameras.forEach((affectedCamera) => {
                const camera = item.cameras[affectedCamera.camera];
                if (camera) {
                  // update frame
                  affectedCamera.frames.forEach((affectedFrame) => {
                    camera.createFrameFromData(affectedFrame);
                  });
                } else {
                  // no camera, create
                  item.createCameraFromData(affectedCamera);
                }
                // readd shape
                setupShape(item, affectedCamera.camera);
              });
            } else {
              // no instance item, create
              instance.createItemFromData(affectedItem);
              const createdItem = instance.items[affectedItem.id];
              // readd shapes
              affectedItem.cameras.forEach((affectedCamera) => {
                setupShape(createdItem, affectedCamera.camera);
              });
            }
          });
          if (instance.number !== affectedInstance.number) {
            instance.number = affectedInstance.number;
            Object.values(instance.items).forEach((item) => {
              Object.keys(item.cameras).forEach((camera) => {
                setupShape(item, camera);
              });
            });
          }
        } else {
          // no instance, create
          createInstanceFromData(affectedInstance);
          const createdInstance = getInstanceById(affectedInstance.id);
          affectedInstance.children.forEach((affectedItem) => {
            const item = createdInstance.items[affectedItem.id];
            // readd shapes
            affectedItem.cameras.forEach((affectedCamera) => {
              setupShape(item, affectedCamera.camera);
            });
          });
        }
      }
    });

    prev.frames?.forEach((affectedCamera) => {
      const { camera, frames } = affectedCamera;
      if (this.rootStore.frame.attributes[camera]) {
        frames.forEach(({ frameIndex }) => {
          delete this.rootStore.frame.attributes[camera][frameIndex];
        });
      }
    });
    curr.frames?.forEach((affectedCamera) => {
      const { camera, frames } = affectedCamera;
      if (!this.rootStore.frame.attributes[camera]) {
        this.rootStore.frame.attributes[camera] = {};
      }
      frames.forEach(({ frameIndex, ...attributes }) => {
        this.rootStore.frame.attributes[camera][frameIndex] = { frameIndex, ...attributes };
      });
    });

    prev.reviews?.forEach((affectedReview) => {
      const { id, frameIndex } = affectedReview;
      const frameReviews = this.rootStore.review.reviews[frameIndex] || [];
      const index = frameReviews.findIndex((r) => r.id === id);
      if (index >= 0) {
        frameReviews.splice(index, 1);
      }
      const { anchor } = this.rootStore.review.anchors[id] || {};
      if (anchor) {
        delete this.rootStore.review.anchors[id];
        anchor.destroy();
      }
    });
    curr.reviews?.forEach((affectedReview) => {
      const { frameIndex, camera } = affectedReview;
      const review = new ReviewItem(affectedReview);
      if (!this.rootStore.review.reviews[frameIndex]) {
        this.rootStore.review.reviews[frameIndex] = [];
      }
      this.rootStore.review.reviews[frameIndex].push(review);
      if (frameIndex === currentFrame) {
        const cameraView = this.rootStore.frame.cameraViews[camera];
        if (cameraView && cameraView.reviewLayer) {
          const anchor = this.rootStore.review.createReviewAnchor(review.result, review.x, review.y, cameraView.reviewLayer, cameraView.viewScale);
          if (anchor) {
            this.rootStore.review.anchors[review.id] = {
              anchor,
              camera,
            };
          }
        }
      }
    });

    // reselect instance or instance item
    if (Object.keys(selectedInstanceMap).length > 0) {
      const instances: MInstance[] = [];
      const instanceItems: MInstanceItem[] = [];
      Object.keys(selectedInstanceMap).forEach((instanceId) => {
        const instance = getInstanceById(instanceId);
        if (instance) {
          instances.push(instance);
          const itemIds = selectedInstanceMap[instanceId];
          Object.values(instance.items).forEach((item) => {
            if (itemIds.includes(item.id)) {
              instanceItems.push(item);
            }
          });
        }
      });
      if (instanceItems.length > 0) {
        this.rootStore.instance.selectInstanceItem(instanceItems);
      } else if (instances.length > 0) {
        this.rootStore.instance.selectInstance(instances);
      }
    }
    this.rootStore.shape.predict();

    // reselect review item
    if (this.rootStore.review.selectedReviewId) {
      const review = this.rootStore.review.allReviews.find((r) => r.id === this.rootStore.review.selectedReviewId);
      if (review) {
        const { anchor } = this.rootStore.review.anchors[review.id] || {};
        if (anchor) {
          this.rootStore.review.selectReview(review, anchor);
        }
      }
    }
  };
}
