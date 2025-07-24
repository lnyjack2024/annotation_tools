import { action, makeObservable, observable } from 'mobx';
import { cloneDeep } from 'lodash';
import OntologyStore from './OntologyStore';
import ConfigStore from './ConfigStore';
import FrameStore from './FrameStore';
import InstanceStore from './InstanceStore';
import ShapeStore from './ShapeStore';
import UndoStore from './UndoStore';
import ReviewsStore from './ReviewStore';
import InstanceItem from '../model/InstanceItem';
import i18n from '../locales';
import { loadInstancesFromResult, getToolTypeFromFrameData } from '../utils';
import { Payload, Statistic, ReviewMode } from '../types';
import JobProxy from '../../../libs/JobProxy';
import { isAnnotationReadonly, isReviewEditable, isRework, isPreview, isTemplatePreview, ToolMode } from '../../../utils/tool-mode';

/**
 * root store
 * @class
 */
class RootStore {
  ontology: OntologyStore;

  config: ConfigStore;

  frame: FrameStore;

  instance: InstanceStore;

  shape: ShapeStore;

  undo: UndoStore;

  review: ReviewsStore;

  /**
   * job proxy
   */
  jobProxy?: JobProxy;

  /**
   * initial data copy
   */
  initialData: any = null;

  /**
   * is tool initialized
   */
  initialized = false;

  /**
   * when screenfull requested
   */
  fullscreenRequested = false;

  /**
   * is tool readonly (annotate not allowed)
   */
  get readonly() {
    return isAnnotationReadonly(this.jobProxy!.toolMode) || this.config.reviewMode === ReviewMode.REVIEW;
  }

  /**
   * is tool annotate allowed
   */
  get annotatable() {
    return !isAnnotationReadonly(this.jobProxy!.toolMode);
  }

  /**
   * is tool review enabled
   */
  get reviewable() {
    return isReviewEditable(this.jobProxy!.toolMode);
  }

  /**
   * is tool in labeling mode or template preview mode
   */
  get isLabeling() {
    return this.jobProxy!.toolMode === ToolMode.LABELING || this.isTemplatePreview;
  }

  /**
   * is tool in rework mode
   */
  get isRework() {
    return isRework(this.jobProxy!.toolMode);
  }

  /**
   * is tool in preview mode
   */
  get isPreview() {
    return isPreview(this.jobProxy!.toolMode);
  }

  /**
   * is tool in template preview mode
   */
  get isTemplatePreview() {
    return isTemplatePreview(this.jobProxy!.toolMode);
  }

  constructor() {
    this.ontology = new OntologyStore(this);
    this.config = new ConfigStore(this);
    this.frame = new FrameStore(this);
    this.instance = new InstanceStore(this);
    this.shape = new ShapeStore(this);
    this.undo = new UndoStore(this);
    this.review = new ReviewsStore(this);

    makeObservable(this, {
      initialized: observable,
      init: action,
    });
  }

  async init(payload: Payload) {
    let initError = '';
    const appendError = (msg: string) => {
      initError = `${initError ? '; ' : ''}${msg}`;
    };

    // init common stores
    this.ontology.init(payload);
    this.config.init(payload);

    // load frames
    await this.frame.init(payload);

    // load result & init instances
    try {
      await this.loadResult();
    } catch (e) {
      appendError(i18n.translate('ANNOTATION_DATA_LOAD_ERROR'));
    }

    // load & init reviews
    try {
      await this.loadReviews(payload);
    } catch (e) {
      appendError(i18n.translate('REVIEW_DATA_LOAD_ERROR'));
    }

    // init shapes
    this.shape.init(payload);
    this.initialized = true;

    // throw error
    if (initError) {
      throw new Error(initError);
    }
  }

  /**
   * load annotation result
   */
  async loadResult() {
    const savedResult = await this.jobProxy!.loadSavedResult();
    const reviewFromResult = await this.jobProxy!.loadReviewFrom();

    // copy initial data
    if (reviewFromResult) {
      this.initialData = cloneDeep({
        instances: reviewFromResult.instances,
        frames: reviewFromResult.frames,
      });
    }

    const result = savedResult || reviewFromResult;
    if (!result) {
      return;
    }
    if (result.auditId) {
      this.jobProxy!.setAuditId(result.auditId);
    }
    // set frame attributes
    this.frame.initAttributes(result);
    // load instance
    this.instance.init(loadInstancesFromResult(result));
  }

  /**
   * save annotation result
   */
  async saveResult(submit = false) {
    const statData = this.getInstanceStatistics();
    const statistics = await this.jobProxy!.saveResultStat(statData);
    const instances = this.instance.instancesJSON();
    const frames = this.frame.framesJSON();
    return this.jobProxy!.saveResult({
      auditId: this.jobProxy!.auditId,
      instances,
      frames,
      statistics,
      templateConfig: this.jobProxy!.templateConfig,
    }, submit);
  }

  /**
   * load reviews result
   * @param payload
   */
  async loadReviews(payload: Payload) {
    const result = await this.jobProxy!.loadReviews();
    this.review.init(payload, result?.reviews || result);
  }

  /**
   * save review result
   */
  async saveReviews(submit = false) {
    const reviews = this.review.reviewsJSON();
    const statData = this.review.getReviewStatistics();
    const statistics = await this.jobProxy!.saveReviewStat(statData);
    return this.jobProxy!.saveReviews({
      reviews,
      review_statistics: statistics,
    }, submit);
  }

  /**
   * get instance statistics
   */
  getInstanceStatistics = () => {
    const { categories } = this.ontology;
    const data: Statistic = {
      elements: [],
      categories: categories.map(({ className }) => className),
      shapes: new Set(),
      summary: {},
      frameCount: this.frame.frameCount,
      validFrames: new Set(),
      annotatedFrames: new Set(),
      instanceCount: 0,
      distinctInstanceCount: 0,
    };

    const instances = Object.values(this.instance.instances);
    for (let i = 0; i < instances.length; i += 1) {
      const { id, category, items: objItems, attributes } = instances[i];
      const items = Object.values(objItems);
      const instanceFrames = new Set();
      for (let j = 0; j < items.length; j += 1) {
        const item = items[j];
        const cameras = Object.values(item.cameras);
        for (let k = 0; k < cameras.length; k += 1) {
          const camera = cameras[k];
          const frames = Object.values(camera.frames);
          for (let l = 0; l < frames.length; l += 1) {
            const frame = frames[l];
            const shape = getToolTypeFromFrameData(frame);
            data.shapes.add(shape);
            const key = `${shape}_${category}`;
            if (!data.summary[key]) {
              data.summary[key] = {
                ids: [id],
                category,
                shape,
                count: 1,
                distinctCount: 0,
              };
            } else {
              data.summary[key].count += 1;
              if (!data.summary[key].ids.includes(id)) {
                data.summary[key].distinctCount += 1;
                data.summary[key].ids.push(id);
              }
            }
            instanceFrames.add(frame.frameIndex);
            data.annotatedFrames.add(frame.frameIndex);
            data.elements.push({
              id,
              shape,
              frame: frame.frameIndex + 1,
              category,
              label: attributes,
            });
          }
        }
      }
      data.instanceCount += instanceFrames.size;
      data.distinctInstanceCount += 1;
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
      validFrameCount: data.validFrames.size,
    };
  };

  /**
   * save file
   * @param file
   */
  saveFile = (file: File) => this.jobProxy!.saveFile(file);

  /**
   * delete selected shape point or instance if possible
   */
  delete = () => {
    if (this.readonly || this.config.isAnyModalOpened || this.shape.isDrawing) {
      return;
    }
    this.shape.delete();
  };

  /**
   * add instance item to current frame
   * @param instanceItem
   * @param camera
   */
  addToCurrentFrame = (instanceItem: InstanceItem, camera = this.frame.currentCamera) => {
    this.shape.addShapeToInstanceItem(instanceItem, camera);
  };

  /**
   * move shape up
   * @param toTop
   */
  moveFront = (toTop = false) => {
    if (
      this.readonly ||
      this.config.isAnyModalOpened ||
      this.shape.isDrawing ||
      !this.instance.isSingleSelected
    ) {
      return;
    }
    this.shape.moveFront(toTop);
  };

  /**
   * move shape down
   * @param toBottom
   */
  moveBack = (toBottom = false) => {
    if (
      this.readonly ||
      this.config.isAnyModalOpened ||
      this.shape.isDrawing ||
      !this.instance.isSingleSelected
    ) {
      return;
    }
    this.shape.moveBack(toBottom);
  };

  toggleAddMode = () => {
    if (this.config.reviewMode === ReviewMode.LABELING) {
      this.config.setAddMode(!this.config.addMode);
    } else {
      this.review.setAddMode(!this.review.addMode);
    }
  };

  activateTool = (num: number) => {
    if (this.config.reviewMode === ReviewMode.LABELING) {
      this.ontology.activateCategoryItemByIndex(num === 0 ? 9 : num - 1);
    } else {
      this.review.activateReviewByHotkey(num);
    }
  };

  openAttributesModal = () => {
    if (this.readonly || this.shape.isDrawing) {
      return;
    }

    // open point attributes modal
    const { selectedShapes, selectedPointIndex, shapes } = this.shape;
    if (selectedShapes.length === 1 && selectedPointIndex >= 0) {
      const selectedShape = selectedShapes[0];
      const { instanceItem } = shapes[selectedShape.uid];
      const frameData = instanceItem.cameras[this.frame.currentCamera].frames[this.frame.currentFrame];
      const { pointLabelConfig } = instanceItem.categoryItemRef;
      if (frameData && pointLabelConfig) {
        this.config.setPointAttributesModalVisible(true);
        return;
      }
    }

    // open instance & items attributes modal
    if (this.instance.selectedInstanceAttributesEnabled) {
      this.config.setAttributesModalVisible(true);
    }
  };
}

const rootStore = new RootStore();
export default rootStore;
