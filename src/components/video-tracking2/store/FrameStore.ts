import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { cloneDeep } from 'lodash';
import { message } from 'antd';
import { MessageType } from 'antd/es/message';
import RootStore from './RootStore';
import View, { EventAction } from '../shapes/View';
import { DEFAULT_CAMERA_NAME, SIDEBAR_WIDTH, TOOLBAR_HEIGHT } from '../constants';
import { parseFramesByPaylod, parseLabelConfig } from '../utils';
import { Payload, FrameAttributes, CameraFrameAttributes, LabelConfig, ReviewMode } from '../types';
import i18n from '../locales';
import loader, { ImagePreloader } from '../../../utils/image-preloader';
import { triggerFormRules } from '../../../utils/form';

/**
 * store for frames
 * @class
 */
export default class FrameStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * camera frames
   */
  cameras: { [camera: string]: string[] } = {};

  /**
   * camera views
   */
  cameraViews: { [camera: string]: View } = {};

  /**
   * current active camera
   */
  currentCameraView: View | null = null;

  /**
   * frame attributes (for each camera)
   */
  attributes: {
    [camera: string]: {
      [frameIndex: number]: FrameAttributes;
    }
  } = {};

  /**
   * next shape orders for different cameras & frames
   */
  nextShapeOrders: {
    [camera: string]: {
      [frameIndex: number]: number;
    }
  } = {};

  /**
   * current camera name
   */
  currentCamera = DEFAULT_CAMERA_NAME;

  /**
   * current frame index
   */
  currentFrame = 0;

  /**
   * frame loading
   */
  loading = true;

  /**
   * is playing
   */
  isPlaying = false;

  /**
   * play timer
   */
  playTimer: number | null = null;

  /**
   * image preloader
   */
  imagePreloader: ImagePreloader | null = null;

  /**
   * frame config (for each camera)
   */
  frameConfig?: LabelConfig;

  /**
   * is single camera
   * @getter
   */
  get isSingleCamera() {
    const cameraNames = Object.keys(this.cameras);
    return cameraNames.length === 1;
  }

  /**
   * camera names
   * @getter
   */
  get cameraNames() {
    return Object.keys(this.cameras);
  }

  /**
   * camera count
   * @getter
   */
  get cameraCount() {
    return Object.keys(this.cameras).length;
  }

  /**
   * current cameras frames
   * @getter
   */
  get frames() {
    return this.cameras[this.currentCamera] || [];
  }

  /**
   * current camera frame count
   * @getter
   */
  get frameCount() {
    return this.frames.length;
  }

  /**
   * image boundary
   * @getter
   */
  get imageBounds() {
    return this.getImageBoundsForCamera(this.currentCamera);
  }

  /**
   * is current frame attributes
   * @getter
   */
  get currentFrameAttributes() {
    const { attributes = {} } = this.attributes[this.currentCamera]?.[this.currentFrame] || {};
    return attributes;
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      cameraViews: false,
      nextShapeOrders: false,
      playTimer: false,
      imagePreloader: false,
      imageBounds: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * init from paylod
   * @param payload
   */
  async init(payload: Payload) {
    const cameras = await parseFramesByPaylod(payload);
    // parse frame config
    this.frameConfig = parseLabelConfig(payload.frame_config);

    // update attributes by camera & frames
    let frameCount = 0;
    let defaultAttributes: any;
    if (this.frameConfig) {
      const { updatedValues } = triggerFormRules(this.frameConfig, {});
      if (updatedValues && Object.keys(updatedValues).length > 0) {
        defaultAttributes = updatedValues;
      }
    }
    const attributes: {
      [camera: string]: {
        [frameIndex: number]: FrameAttributes;
      }
    } = {};
    cameras.forEach(({ camera, frames }) => {
      const count = frames.length;
      if (count > frameCount) {
        frameCount = count;
      }
      if (!attributes[camera]) {
        attributes[camera] = {};
      }
      frames.forEach((_, frameIndex) => {
        if (!attributes[camera][frameIndex]) {
          attributes[camera][frameIndex] = {
            frameIndex,
            valid: true,
            originValid: true,
            rotation: 0,
          };
        }
        if (defaultAttributes) {
          if (this.rootStore.annotatable) {
            // save to attributes directly
            attributes[camera][frameIndex].attributes = { ...defaultAttributes };
          } else {
            // just show attribute keys if no value
            attributes[camera][frameIndex].attributes = {};
            Object.keys(defaultAttributes).forEach((key) => {
              attributes[camera][frameIndex].attributes[key] = '';
            });
          }
        }
      });
    });
    this.attributes = attributes;
    runInAction(() => {
      if (cameras.length > 0) {
        // set cameras
        this.cameras = cameras.reduce((acc, curr) => {
          acc[curr.camera] = curr.frames;
          return acc;
        }, {} as { [camera: string]: string[] });
        // setup camera containers
        cameras.forEach(({ camera }) => this.createCameraView(camera));
        // set current camera
        this.setCamera(cameras[0].camera);
        // preload image
        const allImages = Array.from({ length: this.frameCount }).flatMap((_, i) => cameras.map((c) => c.frames[i]));
        this.imagePreloader = loader(allImages);
      }
    });
  }

  /**
   * init attributes
   * @param result
   */
  initAttributes(result: any) {
    const { frames: attrs } = result;
    if (Array.isArray(attrs)) {
      const attributes = toJS(this.attributes);

      attrs.forEach((cameraItem) => {
        const { camera, frames } = cameraItem || {};
        if (camera) {
          if (!attributes[camera]) {
            attributes[camera] = {};
          }
          if (Array.isArray(frames)) {
            frames.forEach((frameItem) => {
              const { frameIndex, imageUrl, imageWidth, imageHeight, valid, attributes: frameAttributes, ...legacyAttributes } = frameItem;
              attributes[camera][frameIndex] = {
                ...attributes[camera][frameIndex],
                frameIndex,
                imageUrl,
                imageWidth,
                imageHeight,
                valid: valid !== false && valid !== 'false',
                rotation: 0,
                attributes: frameAttributes || Object.keys(legacyAttributes).length > 0 ? cloneDeep({ ...legacyAttributes, ...frameAttributes }) : undefined,
              };
            });
          }
        }
      });

      this.attributes = attributes;
    }
  }

  /**
   * create camera view
   * @param camera
   */
  createCameraView(camera: string) {
    const { autoSnapPoint } = this.rootStore.config;
    const cameraView = new View({
      id: camera,
      enableReview: !this.rootStore.isLabeling,
      enableSnap: autoSnapPoint,
    });

    // bind listeners
    cameraView.on(EventAction.SELECTED, (event) => {
      if (event.button === 2) {
        return;
      }
      this.rootStore.shape.unselectShape();
      this.rootStore.review.unselectReview();
    });
    cameraView.on(EventAction.POINTERDOWN, (p, event) => {
      if (event.button === 2) {
        return;
      }
      if (this.rootStore.config.reviewMode === ReviewMode.LABELING) {
        this.rootStore.shape.addShape(p);
      } else {
        this.rootStore.review.addReview(p);
      }
    });
    cameraView.on(EventAction.SCALE_CHANGED, (scale) => {
      if (this.currentCamera === camera) {
        this.rootStore.config.setViewScale(scale);
      }
    });
    cameraView.on(EventAction.POSITION_CHANGED, (p) => {
      if (this.currentCamera === camera) {
        this.rootStore.config.setViewPosition(p);
      }
    });

    this.cameraViews[camera] = cameraView;
    return cameraView;
  }

  /**
   * get image bounds for camera
   * @param camera
   */
  getImageBoundsForCamera(camera: string) {
    const cameraView = this.cameraViews[camera];
    const w = cameraView?.image.width;
    const h = cameraView?.image.height;
    return { left: 0, top: 0, right: w || 0, bottom: h || 0 };
  }

  /**
   * set current camera
   * @param camera
   */
  setCamera(camera: string) {
    // set selected camera
    this.currentCamera = camera;
    const cameraView = this.cameraViews[camera];
    if (cameraView) {
      cameraView.selected = true;
      this.currentCameraView = cameraView;
      this.updateCameraLayers(cameraView);
    }
  }

  /**
   * update working layers by camera view
   * @param cameraView
   */
  updateCameraLayers(cameraView: View) {
    // update view scale
    this.rootStore.config.setViewScale(cameraView.viewScale);
    // update shapes layer
    this.rootStore.shape.currentLayer = cameraView.shapesLayer;
    // update review layer
    if (cameraView.reviewLayer) {
      this.rootStore.review.setReviewLayer(cameraView.reviewLayer);
      this.rootStore.review.setReviewLayerOffset(SIDEBAR_WIDTH, TOOLBAR_HEIGHT * 2);
    }
  }

  /**
   * set current frame
   * @param frameIndex
   */
  setFrame(frameIndex: number) {
    if (frameIndex !== this.currentFrame) {
      // frame changes
      this.currentFrame = frameIndex;
      this.loading = true;
      this.rootStore.review.clearAnchors();
    }
  }

  /**
   * when frame loaded
   * @param image
   */
  onFrameLoaded() {
    // turn off add mode
    this.rootStore.config.setAddMode(false);
    // setup current shapes
    this.rootStore.shape.setupShapes();
    // setup reivew anchors
    this.rootStore.review.setupReviewAnchors();

    // select shape
    const { selectedInstanceItems, selectedInstances } = this.rootStore.instance;
    if (selectedInstanceItems.length > 0) {
      this.rootStore.shape.selectShapeByInstanceItem(selectedInstanceItems);
    } else if (selectedInstances.length > 0) {
      this.rootStore.shape.updateShapesInInstance(selectedInstances);
    }
    // predict
    this.rootStore.shape.predict();

    this.loading = false;

    // preload image
    this.imagePreloader?.preload((this.currentFrame + 1) * this.cameraCount);

    // when loaded, if is auto playing, play next frame
    if (this.isPlaying) {
      this.playTimer = window.setTimeout(() => {
        this.setFrameByAutoPlay();
      }, 300);
    }
  }

  /**
   * go to previous frame by step
   * @param step
   */
  prev(step: number) {
    if (!this.isPlaying) {
      this.setFrame(Math.max(this.currentFrame - step, 0));
    }
  }

  /**
   * go to next frame by step
   * @param step
   */
  next(step: number) {
    if (!this.isPlaying) {
      this.setFrame(Math.min(this.currentFrame + step, this.frameCount - 1));
    }
  }

  /**
   * toggle playing
   */
  togglePlaying() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.setFrameByAutoPlay();
    } else if (this.playTimer) {
      window.clearTimeout(this.playTimer);
      this.playTimer = null;
    }
  }

  /**
   * set frame by auto play
   */
  setFrameByAutoPlay() {
    if (this.currentFrame < this.frameCount - 1) {
      this.setFrame(this.currentFrame + 1);
    } else {
      this.isPlaying = false;
      this.setFrame(0);
    }
  }

  /**
   * can update attributes by camera & frameIndex
   * @param camera
   * @param frameIndex
   */
  canUpdateFrameForCamera(camera: string, frameIndex: number) {
    if (this.rootStore.readonly) {
      return false;
    }
    if (!this.attributes[camera] || !this.attributes[camera][frameIndex]) {
      // attributes not initialized as expected, may have wrong frames or base_url input
      return false;
    }
    return true;
  }

  /**
   * set frame attributes & frame valid
   * @param camera
   * @param frames
   * @param attributes
   */
  setFrameAttributesForCamera(
    camera: string,
    frames: number[],
    attributes: any,
  ) {
    const currentFramesData: FrameAttributes[] = [];
    const newFramesData: FrameAttributes[] = [];
    frames.sort((a, b) => a - b).forEach((frameIndex) => {
      if (this.canUpdateFrameForCamera(camera, frameIndex)) {
        currentFramesData.push(toJS(this.attributes[camera][frameIndex]));
        this.attributes[camera][frameIndex].attributes = cloneDeep(attributes);
        newFramesData.push(toJS(this.attributes[camera][frameIndex]));
      }
    });
    if (currentFramesData.length > 0) {
      const storeId = this.rootStore.undo.preserve({
        frames: [{ camera, frames: currentFramesData }],
      });
      this.rootStore.undo.save(storeId, {
        frames: [{ camera, frames: newFramesData }],
      });
    }
  }

  /**
   * get next shape order & do increment
   * @param frameIndex
   * @param camera
   */
  getNextShapeOrder = (frameIndex = this.currentFrame, camera = this.currentCamera) => {
    if (this.nextShapeOrders[camera] === undefined) {
      this.nextShapeOrders[camera] = {};
    }
    if (this.nextShapeOrders[camera][frameIndex] === undefined) {
      this.nextShapeOrders[camera][frameIndex] = 0;
    }

    const order = this.nextShapeOrders[camera][frameIndex];
    this.nextShapeOrders[camera][frameIndex] += 1;
    return order;
  };

  /**
   * update next shape order
   * @param currentOrder
   * @param frameIndex
   * @param camera
   */
  updateNextShapeOrder(currentOrder: number, frameIndex = this.currentFrame, camera = this.currentCamera) {
    if (this.nextShapeOrders[camera] === undefined) {
      this.nextShapeOrders[camera] = {};
    }
    if (this.nextShapeOrders[camera][frameIndex] === undefined || this.nextShapeOrders[camera][frameIndex] <= currentOrder) {
      this.nextShapeOrders[camera][frameIndex] = currentOrder + 1;
    }
  }

  /**
   * update image size
   * @param camera
   * @param frameIndex
   * @param width
   * @param height
   */
  updateImageSize(camera: string, frameIndex: number, width: number, height: number) {
    if (this.attributes[camera] && this.attributes[camera][frameIndex]) {
      const { imageWidth, imageHeight } = this.attributes[camera][frameIndex];
      if ((width > 0 && height > 0) || imageWidth === undefined || imageHeight === undefined) {
        // only update when size valid, or size not initialized
        this.attributes[camera][frameIndex].imageWidth = width;
        this.attributes[camera][frameIndex].imageHeight = height;
      }
    }
  }

  /**
   * get frame attributes json data (for save)
   */
  framesJSON(): CameraFrameAttributes[] {
    return Object.keys(this.cameras).map((camera) => ({
      camera,
      frames: this.cameras[camera].map((imageUrl, frameIndex) => ({
        frameIndex,
        imageUrl,
        imageWidth: this.attributes[camera][frameIndex].imageWidth,
        imageHeight: this.attributes[camera][frameIndex].imageHeight,
        valid: true,
        originValid: true,
        rotation: 0,
        attributes: toJS(this.attributes[camera][frameIndex].attributes),
      })),
    }));
  }
}
