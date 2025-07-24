import { makeAutoObservable, toJS } from 'mobx';
import RootStore from './RootStore';
import { Payload, ReviewMode } from '../types';
import Cursor from '../../common/Cursor';
import { isReviewEditable } from '../../../utils/tool-mode';

/**
 * store for config
 * @class
 */
export default class ConfigStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * add mode, true means adding active
   */
  addMode = false;

  /**
   * review mode
   */
  reviewMode = ReviewMode.LABELING;

  /**
   * current cursor
   */
  cursor = Cursor.INHERIT;

  /**
   * canvas view scale factor
   */
  viewScale = 1;

  /**
   * canvas view position
   */
  viewPosition = { x: 0, y: 0 };

  /**
   * whether cross line visible
   */
  crossLineVisible = true;

  /**
   * is attributes modal visible
   */
  attributesModalVisible = false;

  /**
   * point attributes modal visible
   */
  pointAttributesModalVisible = false;

  /**
   * frame attributes modal visible
   */
  frameAttributesModalVisible = false;

  /**
   * is review modal visible
   */
  reviewModalVisible = false;

  /**
   * measurement box list
   */
  measurementBoxList: number[][] | null = null;

  /**
   * active measurement box index
   */
  activeMeasurementBoxIndex = -1;

  /**
   * Whether the shape can be rotated
   */
  rotatable = false;

  /**
   * auto snap to polygon & line vertexes
   */
  autoSnapPoint = true;

  /**
   * active measurement box
   * @getter
   */
  get activeMeasurementBox() {
    return (toJS(this.measurementBoxList) || [])[this.activeMeasurementBoxIndex];
  }

  /**
   * is there any modal opened
   * @getter
   */
  get isAnyModalOpened() {
    return this.attributesModalVisible
      || this.reviewModalVisible
      || this.pointAttributesModalVisible
      || this.frameAttributesModalVisible;
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
   * init from paylod
   * @param payload
   */
  init(payload: Payload) {
    // set default review mode
    this.reviewMode = isReviewEditable(payload.jobProxy.toolMode) ? ReviewMode.REVIEW : ReviewMode.LABELING;

    // parse measurement box list
    if (typeof payload.measurement_box === 'string' && payload.measurement_box) {
      try {
        const list = JSON.parse(payload.measurement_box);
        if (Array.isArray(list) && list.every((i) => i.length === 2 && typeof i[0] === 'number' && typeof i[1] === 'number')) {
          this.measurementBoxList = list;
        }
      } catch (e) {
        // parse error
      }
    }

    // parse rotatable
    this.rotatable = payload.rotatable === 'true' || payload.rotatable === true;

    // parse auto snap point
    this.autoSnapPoint = payload.auto_snap_point !== 'false' && payload.auto_snap_point !== false;
  }

  /**
   * set add mode
   * @param addMode
   */
  setAddMode(addMode: boolean) {
    if (this.rootStore.readonly || this.isAnyModalOpened || !this.rootStore.ontology.selectedCategory) {
      return;
    }

    this.addMode = addMode;
    // change cursor
    this.cursor = addMode ? Cursor.CROSSHAIR : Cursor.DEFAULT;
    // change other shapes interactive
    this.rootStore.shape.updateShapesInteractive(!addMode);
    // remove drawing shape if needed
    if (!addMode && this.rootStore.shape.drawingShape) {
      this.rootStore.shape.drawingShape.destroy();
      this.rootStore.shape.drawingShape = null;
    }
    // hide or show predict shape
    if (addMode) {
      this.rootStore.shape.clearPredictedShapes();
    } else {
      this.rootStore.shape.predict();
    }
  };

  /**
   * set review mode
   * @param reviewMode
   */
  setReviewMode(reviewMode: ReviewMode) {
    if (this.reviewMode !== reviewMode) {
      this.setAddMode(false);
      this.reviewMode = reviewMode;
      this.rootStore.review.unselectReview();
      this.rootStore.shape.updateShapesEditable(reviewMode === ReviewMode.LABELING);
    }
  }

  /**
   * set view scale
   * @param viewScale
   */
  setViewScale(viewScale: number) {
    this.viewScale = viewScale;
    this.rootStore.review.updateAnchorsScale(viewScale);
  }

  /**
   * set view position
   * @param position
   */
  setViewPosition(position: { x: number; y: number }) {
    this.viewPosition = { ...position };
    this.rootStore.shape.redrawShapesLabel();
  }

  /**
   * set cross line visible
   * @param visible
   */
  setCrossLineVisible(visible: boolean) {
    this.crossLineVisible = visible;
  }

  /**
   * set attributes modal visibility
   * @param visible
   */
  setAttributesModalVisible(visible: boolean) {
    this.attributesModalVisible = visible;
  }

  /**
   * set review modal visibility
   * @param visible
   */
  setReviewModalVisible(visible: boolean) {
    this.reviewModalVisible = visible;
  }

  /**
   * set point attributes modal visibility
   * @param visible
   */
  setPointAttributesModalVisible(visible: boolean) {
    this.pointAttributesModalVisible = visible;
  }

  /**
   * set frame attributes modal visibility
   * @param visible
   */
  setFrameAttributesModalVisible(visible: boolean) {
    this.frameAttributesModalVisible = visible;
  }

  /**
   * set measurement box indexs
   * @param index
   */
  setMeasurementBoxIndex(index: number) {
    this.activeMeasurementBoxIndex = index;
  }
}
