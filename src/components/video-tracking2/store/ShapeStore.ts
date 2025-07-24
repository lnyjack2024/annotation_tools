import { Application, Container, Point } from 'pixi.js';
import { makeObservable, observable, action } from 'mobx';
import { message } from 'antd';
import RootStore from './RootStore';
import Instance from '../model/Instance';
import InstanceItem from '../model/InstanceItem';
import FrameData from '../model/FrameData';
import i18n from '../locales';
import { getUnderShape, getUpperShape } from '../utils';
import { Payload, Instance as IInstance, ReviewMode } from '../types';
import { CAMERA_VIEW_LABELS } from '../constants';
import ShapeFactory from '../../common/shapes/ShapeFactory';
import { ShapeType, ShapeData } from '../../common/shapes/types';
import Shape, { EventAction, BorderStyle } from '../../common/shapes/Shape';
import { RectangleData } from '../../common/shapes/Rectangle';
import Polygon, { PolygonData } from '../../common/shapes/Polygon';
import Line from '../../common/shapes/Line';
import Label from '../../common/shapes/label/Label';

/**
 * store for shapes in current camera & current frame
 * @class
 */
export default class ShapeStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * app
   */
  app?: Application;

  /**
   * current layer
   */
  currentLayer?: Container;

  /**
   * shapes in current frame
   */
  shapes: {
    [shapeId: string]: {
      shape: Shape<ShapeData>;
      camera: string;
      instanceItem: InstanceItem;
    }
  } = {};

  /**
   * currently drawing shape
   */
  drawingShape: Shape<ShapeData> | null = null;

  /**
   * currently selected shapes
   */
  selectedShapes: Shape<ShapeData>[] = [];

  /**
   * currently selected shape vertex index for polygon & line
   */
  selectedPointIndex = -1;

  /**
   * predicted shapes
   */
  predictedShapes: {
    [shapeId: string]: {
      shape: Shape<ShapeData>;
      instanceItem: InstanceItem;
    }
  } = {};

  /**
   * hovered shape id
   */
  hoveredShapeId = '';

  /**
   * waiting merge polygon
   */
  pendingMergePolygon = '';

  /**
   * is deleting
   */
  deleting = false;

  /**
   * shape display config
   */
  config = {
    fill: true,
    alpha: 20,
    showVertex: false,
    showVertexOrder: false,
  };

  /**
   * default config from payload
   */
  defaultConfig = this.config;

  /**
   * is drawing shape
   * @getter
   */
  get isDrawing() {
    return this.drawingShape !== null;
  }

  constructor(rootStore: typeof RootStore) {
    makeObservable(this, {
      shapes: observable,
      selectedShapes: observable,
      selectedPointIndex: observable,
      config: observable,
      init: action,
      clearShapes: action,
      setupShapes: action,
      selectShapes: action,
      unselectShape: action,
      addShape: action,
      setupShape: action,
      deleteShape: action,
      updateConfig: action,
    });

    this.rootStore = rootStore;
  }

  /**
   * init from paylod
   * @param payload
   */
  init(payload: Payload) {
    this.config.fill = payload.is_fill !== 'false' && payload.is_fill !== false;
    if (payload.fill_opacity !== undefined && payload.fill_opacity !== '') {
      const alpha = Number(payload.fill_opacity);
      if (!Number.isNaN(alpha) && alpha >= 0 && alpha <= 1) {
        this.config.alpha = alpha * 100;
      }
    }
    this.config.showVertex = payload.show_vertex === 'true' || payload.show_vertex === true;
    this.config.showVertexOrder = payload.show_vertex_order === 'true' || payload.show_vertex_order === true;
    this.defaultConfig = { ...this.config }; // save default settings

    this.app = payload.app;
  }

  /**
   * clear shapes
   */
  clearShapes = () => {
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.destroy();
    });
    this.shapes = {};
    this.drawingShape = null;
    this.selectedShapes = [];
    this.clearPredictedShapes();
    this.selectedPointIndex = -1;
  };

  /**
   * clear predicted shapes
   */
  clearPredictedShapes = () => {
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.destroy();
    });
    this.predictedShapes = {};
  };

  /**
   * is predicted shape
   * @param s
   */
  isPredictedShape = (s: Shape<ShapeData>) => Object.values(this.predictedShapes).findIndex(({ shape }) => shape === s) >= 0;

  /**
   * get shape by instance item
   * @param instanceItem
   */
  getShapeByInstanceItem = (instanceItem: InstanceItem, camera = this.rootStore.frame.currentCamera) => {
    const shapeItem = Object.values(this.shapes).find((i) => i.camera === camera && i.instanceItem === instanceItem);
    if (shapeItem) {
      return shapeItem.shape;
    }
    return undefined;
  };

  /**
   * get shapes by instance items
   * @param instanceItems
   * @param camera
   */
  getShapesByInstanceItems = (instanceItems: InstanceItem[], camera = this.rootStore.frame.currentCamera) => {
    const shapeItems = Object.values(this.shapes).filter((i) => i.camera === camera && instanceItems.indexOf(i.instanceItem) >= 0);
    return shapeItems.map((i) => i.shape);
  };

  /**
   * get shapes for one camera
   * @param camera
   */
  getShapesForCamera = (camera: string) => Object.values(this.shapes).filter((s) => s.camera === camera);

  /**
   * update shapes interactive
   * @param interactive
   * @param ignoreIds
   */
  updateShapesInteractive = (interactive: boolean, ignoreIds?: string[]) => {
    Object.values(this.shapes).forEach(({ shape }) => {
      if (ignoreIds && ignoreIds.includes(shape.uid)) {
        return;
      }
      shape.interactive = interactive;
      if (interactive && this.selectedShapes.indexOf(shape) >= 0) {
        shape.selected = true;
      }
    });
  };

  /**
   * update shapes editable
   * @param editable
   */
  updateShapesEditable(editable: boolean) {
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.editable = editable;
    });
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.editable = editable;
    });
  }

  /**
   * redraw shapes label
   */
  redrawShapesLabel = () => {
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.drawShapeLabel();
    });
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.drawShapeLabel();
    });
  };

  /**
   * setup shapes for current frame
   */
  setupShapes = () => {
    this.clearShapes();
    const { cameraViews, currentFrame, cameraNames, getImageBoundsForCamera } = this.rootStore.frame;
    const allShapeOrders: {
      [camera: string]: Set<number>;
    } = {};
    const noOrderShapes: {
      [camera: string]: { frameData: FrameData, shape: Shape<ShapeData> }[];
    } = {};
    cameraNames.forEach((cameraName) => {
      allShapeOrders[cameraName] = new Set();
      noOrderShapes[cameraName] = [];
    });
    const startOrder = 0;
    Object.values(this.rootStore.instance.instances).forEach((instance) => {
      Object.values(instance.items).forEach((item) => {
        Object.values(item.cameras).forEach(({ camera }) => {
          const { frames } = item.cameras[camera];
          const cameraView = cameraViews[camera];
          if (frames[currentFrame] && cameraView && !cameraView.imageLoadError) {
            const shape = this.createShape(
              cameraView.shapesLayer,
              getImageBoundsForCamera(camera),
              item.categoryItemRef.displayColor,
              instance.category,
              item.name,
              frames[currentFrame].shapeType,
              frames[currentFrame].shape,
              frames[currentFrame].order,
              item.label,
              camera,
            );
            if (shape.destroyed) {
              // delete instance item
              this.rootStore.instance.deleteInstanceItemByFrame(item, currentFrame, camera);
              return;
            }
            if (this.rootStore.readonly) {
              shape.editable = false;
            }
            this.addShapeListeners(shape);
            this.shapes[shape.uid] = {
              shape,
              camera,
              instanceItem: item,
            };

            const { order } = frames[currentFrame];
            if (typeof order === 'number' && order >= startOrder && !allShapeOrders[camera].has(order)) {
              // update next shape order
              shape.order = order;
            } else {
              // add to temp array
              noOrderShapes[camera].push({ frameData: frames[currentFrame], shape });
            }
          }
        });
      });
    });
    Object.keys(noOrderShapes).forEach((cameraName) => {
      noOrderShapes[cameraName].forEach(({ frameData, shape }) => {
        // new order
        shape.order = this.rootStore.frame.getNextShapeOrder(currentFrame, cameraName);
        frameData.order = shape.order;
      });
    });
  };

  /**
   * create shape label dom
   */
  createShapeLabel(camera = this.rootStore.frame.currentCamera) {
    const shapeLabelsContainer = document.getElementById(`${CAMERA_VIEW_LABELS}-${camera}`);
    if (shapeLabelsContainer) {
      const shapeLabel = new Label({
        className: 'shape-label',
        transPosition: (p) => {
          const cameraView = this.rootStore.frame.cameraViews[camera];
          if (cameraView) {
            return cameraView.toLocal(p);
          }
          return p;
        },
      });
      shapeLabel.addToContainer(shapeLabelsContainer);
      return shapeLabel;
    }
    return undefined;
  }

  /**
   * create shape instance
   * @param shapeContainer
   * @param imageBounds
   * @param hexColor
   * @param categoryName
   * @param categoryItemName
   * @param shapeType
   * @param shapeData
   * @param order
   * @param label
   */
  createShape(
    shapeContainer: Container,
    imageBounds: { left: number; top: number; right: number; bottom: number; },
    hexColor: string,
    categoryName: string,
    categoryItemName: string,
    shapeType?: ShapeType,
    shapeData?: ShapeData,
    order?: number,
    label?: string,
    camera?: string,
  ) {
    const { rotatable } = this.rootStore.config;
    const { currentShapeType } = this.rootStore.ontology;
    const useCurrent = shapeType === undefined;
    const color = parseInt(hexColor.substr(1), 16);
    const type = shapeType || currentShapeType;
    const shape = ShapeFactory.getShape(type, {
      app: this.app!,
      container: shapeContainer,
      color,
      alpha: this.config.fill ? this.config.alpha / 100 : 0,
      showVertex: this.config.showVertex,
      showVertexOrder: this.config.showVertexOrder,
      label,
      ...shapeData,
      ...(type === ShapeType.RECTANGLE || type === ShapeType.POLYGON) && {
        rotatable,
      },
      labelDom: this.createShapeLabel(camera),
      scale: this.rootStore.frame.cameraViews[camera || this.rootStore.frame.currentCamera]?.viewScale,
    });
    // destroyed, not need to proceed
    if (shape?.destroyed) {
      return shape;
    }
    // update order, prefer to use given order
    if (order !== undefined) {
      shape!.order = order;
    } else if (useCurrent) {
      shape!.order = this.rootStore.frame.getNextShapeOrder();
    }
    // set default rotation for rectangle
    if (shapeData && type === ShapeType.RECTANGLE) {
      shape!.rotation = (shapeData as RectangleData).rotation || 0;
    }
    return shape!;
  }

  /**
   * add shape listeners
   * @param shape
   */
  addShapeListeners(shape: Shape<ShapeData>) {
    shape.on(EventAction.SELECTED, (s, p) => {
      if (!this.isPredictedShape(s)) {
        if (this.selectedShapes.length === 1 && s.uid !== this.selectedShapes[0].uid) {
          if (this.pendingMergePolygon) {
            this.mergePolygons(this.pendingMergePolygon, shape.uid);
            this.pendingMergePolygon = '';
            return;
          }
        }
        if (this.selectedShapes.indexOf(s) < 0) {
          this.selectShapes([s]);
          this.rootStore.instance.selectInstanceItem(this.shapes[s.uid].instanceItem);
        }
      } else {
        // clear selected shape status
        this.selectedShapes.forEach((ss) => {
          ss.selected = false;
        });
        this.selectedShapes = [];
        // clear predicted shape selected status
        Object.values(this.predictedShapes).forEach((predictedShape) => {
          if (predictedShape.shape !== s) {
            predictedShape.shape.selected = false;
          }
        });
        this.rootStore.instance.updateSelectedInstanceItem(this.predictedShapes[s.uid].instanceItem);
      }
      if (this.rootStore.review.addMode) {
        this.rootStore.review.addReview(p);
      }
    });
    shape.on(EventAction.CHANGED, (s, data) => {
      if (this.isPredictedShape(s)) {
        this.addShapeToInstanceItem(this.predictedShapes[s.uid].instanceItem);
      } else {
        const { instanceItem } = this.shapes[s.uid];
        const { currentFrame } = this.rootStore.frame;
        if (!this.deleting) {
          this.rootStore.instance.updateFrameShapeForInstanceItem(instanceItem, currentFrame, s.shapeType, data);
        }
      }
    });
    shape.on(EventAction.REMOVED, (s) => {
      if (!this.deleting) {
        const { instanceItem } = this.shapes[s.uid];
        if (instanceItem) {
          this.rootStore.instance.deleteFramesFromInstanceItem(instanceItem, [this.rootStore.frame.currentFrame]);
        }
      }
    });
    shape.on(EventAction.POINTER_OVER, (s) => {
      if (!this.isPredictedShape(s)) {
        this.hoveredShapeId = s.uid;
      }
    });
    shape.on(EventAction.POINTER_OUT, (s) => {
      if (!this.isPredictedShape(s)) {
        this.hoveredShapeId = '';
      }
    });
    shape.on(EventAction.VERTEX_SELECTED, (s, index) => {
      if (this.isPredictedShape(s)) {
        return;
      }
      this.rootStore.instance.selectInstanceItem(this.shapes[s.uid].instanceItem);
      if (this.selectedShapes.length === 1 && this.selectedShapes[0] === s) {
        this.selectedPointIndex = index;
      } else {
        this.selectedPointIndex = -1;
      }
    });
  }

  /**
   * select shapes
   * @param shapes
   */
  selectShapes = (shapes: Shape<ShapeData>[]) => {
    if (this.selectedPointIndex >= 0) {
      // has point selected
      if (this.selectedShapes.length === 1 && shapes.length === 1 && this.selectedShapes[0] === shapes[0]) {
        // same shape, do not unselect
        return;
      }
      this.selectedPointIndex = -1;
    }
    this.selectedShapes.forEach((shape) => {
      if (shapes.indexOf(shape) < 0) { // not selected any more
        shape.selected = false;
      }
    });
    this.selectedShapes = [...shapes];
    this.selectedShapes.forEach((shape) => {
      shape.selected = true;
    });
  };

  /**
   * select shape by instance item
   * @param instanceItem
   */
  selectShapeByInstanceItem = (instanceItem: InstanceItem | InstanceItem[] | null) => {
    const instanceItems = Array.isArray(instanceItem) ? instanceItem : [...instanceItem ? [instanceItem] : []];
    const shapes = this.getShapesByInstanceItems(instanceItems);
    this.selectShapes(shapes);
    const instancesSet = new Set(instanceItems.map((i) => i.instance));
    this.updateShapesInInstance(Array.from(instancesSet));
    this.predict();
  };

  /**
   * fit shapes to canvas for selected instances
   */
  fitShapes() {
    const { currentCamera, cameraNames, cameraViews } = this.rootStore.frame;
    const { selectedInstanceItems, selectedInstances } = this.rootStore.instance;

    const cameraShapes = selectedInstanceItems.length > 0
      ? [{ camera: currentCamera, shapes: this.getShapesByInstanceItems(selectedInstanceItems) }]
      : cameraNames.map((camera) => ({
        camera,
        shapes: Object.values(this.shapes).filter((s) => s.camera === camera && selectedInstances.indexOf(s.instanceItem.instance) >= 0).map((s) => s.shape),
      }));
    cameraShapes.forEach(({ camera, shapes }) => {
      const cameraView = cameraViews[camera];
      if (shapes.length > 0 && cameraView) {
        let { left, top, right, bottom } = shapes[0].instance.getLocalBounds();
        for (let i = 1; i < shapes.length; i += 1) {
          const bbox = shapes[i].instance.getLocalBounds();
          left = Math.min(bbox.left, left);
          top = Math.min(bbox.top, top);
          right = Math.max(bbox.right, right);
          bottom = Math.max(bbox.bottom, bottom);
        }
        cameraView.fitShapeToView({ left, top, right, bottom }, 0.5);
      }
    });
  }

  /**
   * click to unselect shape
   */
  unselectShape = () => {
    if (
      this.rootStore.config.addMode
    ) {
      return;
    }
    this.selectedShapes.forEach((shape) => {
      shape.selected = false;
    });
    this.selectedShapes = [];
    this.rootStore.instance.selectInstance(null);
  };

  /**
   * update shape border color
   * @param instance
   */
  updateShapesInInstance = (instance?: Instance | Instance[] | null) => {
    const instances = Array.isArray(instance) ? instance : [...instance ? [instance] : []];
    Object.values(this.shapes).forEach(({ shape, instanceItem }) => {
      if (instances.indexOf(instanceItem.instance) >= 0) {
        shape.borderColor = 0xFFFF00;
        if (shape.shapeType === ShapeType.DOT) {
          shape.color = 0xFFFF00;
        }
      } else {
        shape.borderColor = shape.originColors.borderColor;
        if (shape.shapeType === ShapeType.DOT) {
          shape.color = shape.originColors.color;
        }
      }
    });
  };

  /**
   * click to draw a shape
   * @param point
   * @param shapeContainer
   * @param imageBounds
   * @param finishCallback
   */
  addShape = (
    point?: Point,
    shapeContainer?: Container,
    imageBounds?: { left: number; top: number; right: number; bottom: number },
    finishCallback?: () => void,
  ) => {
    if (this.rootStore.initialized && this.rootStore.config.addMode && !this.drawingShape) {
      this.drawingShape = this.createShape(
        shapeContainer || this.currentLayer!,
        imageBounds || this.rootStore.frame.imageBounds,
        this.rootStore.ontology.selectedCategoryItem.displayColor,
        this.rootStore.ontology.selectedCategory.className,
        this.rootStore.ontology.selectedCategoryItem.name,
      );

      // add listeners
      this.drawingShape.on(EventAction.FINISHED, (shape, otherShapeData) => {
        // remove listeners after creating
        shape.off(EventAction.FINISHED);
        shape.off(EventAction.REMOVED);

        this.drawingShape = null;
        this.rootStore.config.setAddMode(false);
        // add shape to instance item
        this.addShapeToCurrentInstanceItem(shape, otherShapeData);

        // finish creating
        // if (finishCallback) {
        //   finishCallback();
        // }
      });
      this.drawingShape.on(EventAction.REMOVED, () => {
        this.drawingShape = null;
      });
      // start create
      this.drawingShape.create(point);
      return this.drawingShape;
    }
    return null;
  };

  /**
   * add shape to current instance item
   * @param shape
   */
  addShapeToCurrentInstanceItem = (shape: Shape<ShapeData>, otherShapeData?: ShapeData[]) => {
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const instanceItem = this.rootStore.instance.getCurrentInstanceItem();
    const data = shape.getData();
    const prevBasicInfo = instanceItem.instance.getBasicInfo();
    const { prevState: prevStateItem, currState: currStateItem } = instanceItem.addShape(
      currentCamera,
      currentFrame,
      true,
      shape.shapeType,
      data,
      shape.order,
    );
    const basicInfo = instanceItem.instance.getBasicInfo();
    const attributes = instanceItem.cameras[currentCamera].frames[currentFrame].attributes;
    const instanceState: Record<string, { prev: IInstance, curr: IInstance }> = {
      [prevBasicInfo.id]: {
        prev: { ...prevBasicInfo, children: prevStateItem ? [prevStateItem] : [] },
        curr: { ...basicInfo, children: currStateItem ? [currStateItem] : [] }
      }
    };

    if (otherShapeData) {
      otherShapeData.forEach((shapeData) => {
        const otherInstanceItem = this.rootStore.instance.getCurrentInstanceItem();

        const prevInfo = otherInstanceItem.instance.getBasicInfo();
        if (otherInstanceItem.instance !== instanceItem.instance) {
          otherInstanceItem.instance.setAttributes(instanceItem.instance.attributes);
        }

        const { prevState, currState } = otherInstanceItem.updateShape(
          currentCamera,
          currentFrame,
          true,
          shape.shapeType,
          shapeData,
          this.rootStore.frame.getNextShapeOrder(),
          attributes,
        );
        this.setupShape(otherInstanceItem);
        const currInfo = otherInstanceItem.instance.getBasicInfo();
        if (!instanceState[currInfo.id]) {
          instanceState[currInfo.id] = {
            prev: { ...prevInfo, children: [] },
            curr: { ...currInfo, children: [] }
          };
        }
        const state = instanceState[currInfo.id];
        if (prevState) {
          state.prev.children.push(prevState);
        }
        if (currState) {
          state.curr.children.push(currState);
        }
      });
    }

    this.rootStore.undo.push({
      instances: Object.values(instanceState).map((i) => i.prev).filter((i) => i.children.length > 0),
    }, {
      instances: Object.values(instanceState).map((i) => i.curr),
    });

    // update shape instance
    shape.label = instanceItem.label;
    this.addShapeListeners(shape);
    this.shapes[shape.uid] = { shape, camera: currentCamera, instanceItem };

    // select
    this.rootStore.instance.selectInstanceItem(instanceItem);
    this.rootStore.instance.autoOpenAttributesModal();
  };

  /**
   * add predicted shape to instance item
   * @param instanceItem
   * @param camera
   */
  addShapeToInstanceItem = (instanceItem: InstanceItem, camera = this.rootStore.frame.currentCamera) => {
    const { currentCamera, currentFrame, cameraViews, getImageBoundsForCamera } = this.rootStore.frame;
    const currentCameraView = cameraViews[camera];
    const imageBounds = getImageBoundsForCamera(camera);
    if (currentCameraView?.imageLoadError) {
      return;
    }

    const cameraData = instanceItem.cameras[camera];
    if (cameraData?.frames[currentFrame]) {
      return;
    }

    let shapeInfo;
    const predictedItem = Object.values(this.predictedShapes).find((i) => i.instanceItem === instanceItem);
    if (camera === currentCamera && predictedItem) {
      // predicted shape in current camera exists, use it
      const { shape } = predictedItem;
      shapeInfo = {
        shapeType: shape.shapeType,
        shape: shape.getData(),
      };
      // remove predicted shape
      shape.destroy();
      delete this.predictedShapes[shape.uid];
    } else {
      shapeInfo = instanceItem.predictShape(camera, currentFrame, imageBounds, true);
    }

    if (shapeInfo) {
      // add to model
      this.rootStore.instance.updateFrameShapeForInstanceItem(
        instanceItem,
        currentFrame,
        shapeInfo.shapeType,
        shapeInfo.shape,
        this.rootStore.frame.getNextShapeOrder(currentFrame, camera),
        camera,
      );
      // create shape
      this.setupShape(instanceItem, camera, currentCameraView.shapesLayer, imageBounds);
      // select
      this.rootStore.instance.selectInstanceItem(instanceItem);
      this.rootStore.instance.autoOpenAttributesModal();
    }
  };

  /**
   * setup shape in current camera & current frame
   * @param instanceItem
   * @param shapeContainer
   * @param imageBounds
   */
  setupShape = (
    instanceItem: InstanceItem,
    camera = this.rootStore.frame.currentCamera,
    shapeContainer?: Container,
    imageBounds?: { left: number; top: number; right: number; bottom: number; },
  ) => {
    const { cameraViews, currentFrame } = this.rootStore.frame;
    const cameraData = instanceItem.cameras[camera];
    if (cameraData) {
      const frameData = cameraData.frames[currentFrame];
      if (frameData) {
        // remove shape if already exists
        const existingShape = this.getShapeByInstanceItem(instanceItem, camera);
        const existingShapeId = existingShape?.uid;
        if (existingShape) {
          this.deleteShape(existingShape);
        }
        // add shape
        if (!cameraViews[camera]?.imageLoadError) {
          let order;
          if (frameData.order !== undefined) {
            order = frameData.order;
          } else {
            order = this.rootStore.frame.getNextShapeOrder();
          }
          const shape = this.createShape(
            shapeContainer || cameraViews[camera].shapesLayer,
            imageBounds || this.rootStore.frame.getImageBoundsForCamera(camera),
            instanceItem.categoryItemRef.displayColor,
            instanceItem.instance.category,
            instanceItem.name,
            frameData.shapeType,
            frameData.shape,
            order,
            instanceItem.label,
            camera,
          );
          if (shape.destroyed) {
            // delete instance item
            this.rootStore.instance.deleteInstanceItemByFrame(instanceItem, currentFrame, camera);
            return;
          }
          this.addShapeListeners(shape);
          this.shapes[shape.uid] = { shape, camera, instanceItem };
          if (this.pendingMergePolygon === existingShapeId) {
            this.pendingMergePolygon = shape.uid;
          }
        }
      }
    }
  };

  /**
   * predict in current camera & current frame
   */
  predict = () => {
    this.clearPredictedShapes();

    const { isMultiSelected, selectedInstances, selectedInstanceItems } = this.rootStore.instance;
    if (isMultiSelected) {
      return;
    }

    if (selectedInstances.length === 1) {
      const { currentCamera, currentFrame, currentCameraView, imageBounds } = this.rootStore.frame;
      if (currentCameraView?.imageLoadError) {
        return;
      }

      const selectedInstance = selectedInstances[0];
      Object.values(selectedInstance.items).forEach((item) => {
        const shapeInfo = item.predictShape(currentCamera, currentFrame, imageBounds);
        if (shapeInfo) {
          // create predict shape
          const predictedShape = this.createShape(
            this.currentLayer!,
            imageBounds,
            item.categoryItemRef.displayColor,
            selectedInstance.category,
            item.name,
            shapeInfo.shapeType,
            shapeInfo.shape,
            9999, // predicted shape always on the top
            item.label,
          );
          predictedShape.borderStyle = BorderStyle.DASHED;
          predictedShape.borderColor = 0xFFFF00;
          if (predictedShape.shapeType === ShapeType.DOT) {
            predictedShape.color = 0xFFFF00;
          }
          predictedShape.editable = this.rootStore.config.reviewMode === ReviewMode.LABELING;
          if (selectedInstanceItems.indexOf(item) >= 0) {
            predictedShape.selected = true;
          }
          // add listeners
          this.addShapeListeners(predictedShape);

          this.predictedShapes[predictedShape.uid] = {
            shape: predictedShape,
            instanceItem: item,
          };
        }
      });
    }
  };

  /**
   * delete selected shape point or instance
   */
  delete = () => {
    if (this.selectedShapes.length > 0) {
      this.deleting = true;
      this.selectedPointIndex = -1;

      const pointsDeletedShapes: Shape<ShapeData>[] = [];
      this.selectedShapes.forEach((shape) => {
        const deleted = shape.deleteSelectedPoints();
        if (deleted) {
          pointsDeletedShapes.push(shape);
        }
      });

      const { currentFrame } = this.rootStore.frame;
      if (pointsDeletedShapes.length > 0) {
        // has points deleted shapes
        const instanceItems: { instanceItem: InstanceItem, frameIndex: number, shapeType: ShapeType, shape?: ShapeData }[] = [];
        pointsDeletedShapes.forEach((shape) => {
          const shapeItem = this.shapes[shape.uid];
          if (shapeItem) {
            instanceItems.push({
              instanceItem: shapeItem.instanceItem,
              frameIndex: currentFrame,
              shapeType: shape.shapeType,
              shape: shape.destroyed ? undefined : shape.getData(),
            });
          }
        });
        this.rootStore.instance.updateFrameShapeForInstanceItems(instanceItems);
      } else {
        // should delete shapes
        const instanceItems: { instanceItem: InstanceItem, frames: number[] }[] = [];
        this.selectedShapes.forEach((shape) => {
          const shapeItem = this.shapes[shape.uid];
          if (shapeItem) {
            const { instanceItem } = shapeItem;
            instanceItems.push({ instanceItem, frames: [currentFrame] });
          }
        });
        this.rootStore.instance.deleteFramesFromInstanceItems(instanceItems);
        this.predict();
      }
    }
    this.deleting = false;
  };

  /**
   * delete shape instance
   * @param shape
   */
  deleteShape = (shape: Shape<ShapeData>) => {
    const index = this.selectedShapes.indexOf(shape);
    if (index >= 0) {
      this.selectedShapes.splice(index, 1);
    }
    shape.destroy();
    delete this.shapes[shape.uid];
  };

  /**
   * delete shape by instance item
   * @param instanceItem
   */
  deleteShapeByInstanceItem = (instanceItem: InstanceItem) => {
    const shape = this.getShapeByInstanceItem(instanceItem);
    if (shape) {
      this.deleteShape(shape);
    }
  };

  /**
   * set points user data for shape
   * @param shape
   * @param pointIndex
   * @param userData
   */
  setPointUserData = (shape: Shape<ShapeData>, pointIndex: number, userData: any) => {
    if (shape instanceof Polygon || shape instanceof Line) {
      const pointsData = [{ index: pointIndex, userData }];
      shape.setPointsUserData(pointsData);
    }
  };

  /**
   * get intersections for shape
   * @param shape
   */
  getIntersectionsForShape(shape: Shape<ShapeData>) {
    const shapes = this.getShapesForCamera(this.rootStore.frame.currentCamera).map((i) => i.shape).filter((s) => s.visible && s.finished);
    const intersections = shape.findIntersections(shapes);
    return intersections;
  }

  /**
   * exchange two shapes order
   * @param shapeA
   * @param shapeB
   */
  exchangeShapeOrder(shapeA: Shape<ShapeData>, shapeB: Shape<ShapeData>) {
    const { currentCamera, currentFrame } = this.rootStore.frame;

    const orderA = shapeA.order;
    const orderB = shapeB.order;
    const { instanceItem: instanceItemA } = this.shapes[shapeA.uid];
    const { instanceItem: instanceItemB } = this.shapes[shapeB.uid];
    const instanceInfoA = instanceItemA.instance.getBasicInfo();
    const instanceInfoB = instanceItemB.instance.getBasicInfo();

    // save state
    const prevInstances: IInstance[] = [];
    if (instanceItemA.instance.id === instanceItemB.instance.id) {
      // same instance
      prevInstances.push({
        ...instanceInfoA,
        children: [instanceItemA.toJSON(), instanceItemB.toJSON()],
      });
    } else {
      prevInstances.push({
        ...instanceInfoA,
        children: [instanceItemA.toJSON()],
      });
      prevInstances.push({
        ...instanceInfoB,
        children: [instanceItemB.toJSON()],
      });
    }
    const storeId = this.rootStore.undo.preserve({ instances: prevInstances });

    // update a
    instanceItemA.cameras[currentCamera].frames[currentFrame].order = orderB;
    shapeA.order = orderB;
    // update b
    instanceItemB.cameras[currentCamera].frames[currentFrame].order = orderA;
    shapeB.order = orderA;

    const currInstances: IInstance[] = [];
    if (instanceItemA.instance.id === instanceItemB.instance.id) {
      // same instance
      currInstances.push({
        ...instanceInfoA,
        children: [instanceItemA.toJSON(), instanceItemB.toJSON()],
      });
    } else {
      currInstances.push({
        ...instanceInfoA,
        children: [instanceItemA.toJSON()],
      });
      currInstances.push({
        ...instanceInfoB,
        children: [instanceItemB.toJSON()],
      });
    }
    this.rootStore.undo.save(storeId, { instances: currInstances });
  }

  /**
   * move shape to the top of all shapes
   * @param instanceItem
   */
  moveToTop(instanceItem: InstanceItem) {
    const { currentCamera, currentFrame, getNextShapeOrder } = this.rootStore.frame;
    const cameraData = instanceItem.cameras[currentCamera];
    const frameData = cameraData?.frames[currentFrame];
    if (!frameData) {
      return;
    }
    const cameraShapes = this.getShapesForCamera(currentCamera);
    const maxOrder = Math.max(...cameraShapes.map((s) => s.shape.order));
    if (maxOrder === frameData.order) {
      message.warning(i18n.translate('ORDER_FRONT_MOST'));
      return;
    }

    const instanceInfo = instanceItem.instance.getBasicInfo();
    const instanceItemInfo = instanceItem.getBasicInfo();
    // preserve state
    const storeId = this.rootStore.undo.preserve({
      instances: [{
        ...instanceInfo,
        children: [{
          ...instanceItemInfo,
          cameras: [cameraData.toJSON()],
        }],
      }],
    });
    // update order
    const order = getNextShapeOrder();
    frameData.order = order;
    const shape = this.getShapeByInstanceItem(instanceItem, currentCamera);
    if (shape) {
      shape.order = order;
    }
    // save state
    this.rootStore.undo.save(storeId, {
      instances: [{
        ...instanceInfo,
        children: [{
          ...instanceItemInfo,
          cameras: [cameraData.toJSON()],
        }],
      }],
    });

    message.success(i18n.translate('ORDER_TO_TOP_SUCCESS'));
  }

  /**
   * move shape to the bottom of all shapes
   * @param instanceItem
   */
  moveToBottom(instanceItem: InstanceItem) {
    const { currentCamera, currentFrame, updateNextShapeOrder } = this.rootStore.frame;
    const cameraData = instanceItem.cameras[currentCamera];
    const frameData = cameraData?.frames[currentFrame];
    if (!frameData) {
      return;
    }
    const cameraShapes = this.getShapesForCamera(currentCamera);
    const minOrder = Math.min(...cameraShapes.map((s) => s.shape.order));
    if (minOrder === frameData.order) {
      message.warning(i18n.translate('ORDER_BACK_MOST'));
      return;
    }

    const instanceInfo = instanceItem.instance.getBasicInfo();
    const instanceItemInfo = instanceItem.getBasicInfo();

    // prev instance state map
    const prevInstanceMap: { [instanceId: string]: IInstance } = {
      [instanceInfo.id]: {
        ...instanceInfo,
        children: [{
          ...instanceItemInfo,
          cameras: [cameraData.toJSON()],
        }],
      },
    };
    // update selected shape order
    const startOrder = 0;
    frameData.order = startOrder;
    const shape = this.getShapeByInstanceItem(instanceItem, currentCamera);
    if (shape) {
      shape.order = startOrder;
    }
    // current instance state map
    const currInstanceMap: { [instanceId: string]: IInstance } = {
      [instanceInfo.id]: {
        ...instanceInfo,
        children: [{
          ...instanceItemInfo,
          cameras: [cameraData.toJSON()],
        }],
      },
    };

    if (minOrder <= startOrder) {
      // show move all camera shapes upper
      for (let i = 0; i < cameraShapes.length; i += 1) {
        const { shape: s, instanceItem: sInstanceItem } = cameraShapes[i];
        if (sInstanceItem.id !== instanceItem.id) {
          // not selected shape
          const sInstanceInfo = sInstanceItem.instance.getBasicInfo();
          const sInstanceItemInfo = sInstanceItem.getBasicInfo();
          const sCameraData = sInstanceItem.cameras[currentCamera];
          if (!prevInstanceMap[sInstanceInfo.id]) {
            prevInstanceMap[sInstanceInfo.id] = {
              ...sInstanceInfo,
              children: [],
            };
          }
          prevInstanceMap[sInstanceInfo.id].children.push({
            ...sInstanceItemInfo,
            cameras: [sCameraData.toJSON()],
          });
          // update not selected shape's order
          const order = s.order + 1;
          sCameraData.frames[currentFrame].order = order;
          s.order = order;
          updateNextShapeOrder(order, currentFrame, currentCamera);
          if (!currInstanceMap[sInstanceInfo.id]) {
            currInstanceMap[sInstanceInfo.id] = {
              ...sInstanceInfo,
              children: [],
            };
          }
          currInstanceMap[sInstanceInfo.id].children.push({
            ...sInstanceItemInfo,
            cameras: [sCameraData.toJSON()],
          });
        }
      }
    }

    // save state
    this.rootStore.undo.push({
      instances: Object.values(prevInstanceMap),
    }, {
      instances: Object.values(currInstanceMap),
    });

    message.success(i18n.translate('ORDER_TO_BOTTOM_SUCCESS'));
  }

  /**
   * move selected shape to front
   * @param toTop
   */
  moveFront = (toTop = false) => {
    if (this.selectedShapes.length === 1) {
      const selectedShape = this.selectedShapes[0];
      if (toTop) {
        this.moveToTop(this.shapes[selectedShape.uid].instanceItem);
        return;
      }
      const intersections = this.getIntersectionsForShape(selectedShape);
      if (intersections.length > 0) {
        const upperShape = getUpperShape(selectedShape, intersections);
        if (upperShape) {
          this.exchangeShapeOrder(selectedShape, upperShape);
          message.success(i18n.translate('ORDER_FRONT_SUCCESS'));
        } else {
          message.warning(i18n.translate('ORDER_FRONT_MOST'));
        }
      } else {
        message.warning(i18n.translate('ORDER_NO_INTERSECT'));
      }
    }
  };

  /**
   * move selected shape to back
   * @param toBottom
   */
  moveBack = (toBottom = false) => {
    if (this.selectedShapes.length === 1) {
      const selectedShape = this.selectedShapes[0];
      if (toBottom) {
        this.moveToBottom(this.shapes[selectedShape.uid].instanceItem);
        return;
      }
      const intersections = this.getIntersectionsForShape(selectedShape);
      if (intersections.length > 0) {
        const underShape = getUnderShape(selectedShape, intersections);
        if (underShape) {
          this.exchangeShapeOrder(selectedShape, underShape);
          message.success(i18n.translate('ORDER_BACK_SUCCESS'));
        } else {
          message.warning(i18n.translate('ORDER_BACK_MOST'));
        }
      } else {
        message.warning(i18n.translate('ORDER_NO_INTERSECT'));
      }
    }
  };

  merge = () => {
    if (
      this.rootStore.readonly ||
      this.rootStore.config.isAnyModalOpened ||
      this.isDrawing ||
      this.selectedShapes.length !== 1
    ) {
      return;
    }

    const selectedShape = this.selectedShapes[0];
    const { shapeType } = selectedShape;
    if (shapeType === ShapeType.POLYGON) {
      // merge polygon
      const shapes = this.getShapesForCamera(this.rootStore.frame.currentCamera).map((i) => i.shape);
      const intersectPolygonIds = (selectedShape as Polygon).findIntersectPolygons(shapes);
      if (intersectPolygonIds.length === 1) {
        this.mergePolygons(selectedShape.uid, intersectPolygonIds[0]);
      } else if (intersectPolygonIds.length === 0) {
        message.warn(i18n.translate('MERGE_NO_INTERSECT'));
      } else {
        this.pendingMergePolygon = selectedShape.uid;
        message.info(i18n.translate('MERGE_SELECT_NEXT'));
      }
    }
  };

  mergePolygons(polygonId1: string, polygonId2: string) {
    const { shape: polygon1, instanceItem: instance1 } = this.shapes[polygonId1];
    const { shape: polygon2, instanceItem: instance2 } = this.shapes[polygonId2];
    const mergedData = (polygon1 as Polygon).merge(polygon2 as Polygon);
    if (mergedData.length === 1) {
      const { currentCamera, currentFrame } = this.rootStore.frame;
      const { prevState, currState } = this.rootStore.instance.deleteInstanceItemByFrame(instance2, currentFrame);

      const { prevState: prevStateItem, currState: currStateItem } = instance1.updateShape(
        currentCamera,
        currentFrame,
        true,
        ShapeType.POLYGON,
        mergedData[0],
        this.rootStore.frame.getNextShapeOrder(),
      );

      this.setupShape(instance1);
      this.selectShapeByInstanceItem(instance1);
      const basicInfo = instance1.instance.getBasicInfo();

      this.rootStore.undo.push({
        instances: [
          ...prevState.instances,
          ...prevStateItem ? [{ ...basicInfo, children: [prevStateItem] }] : [],
        ],
      }, {
        instances: [
          ...currState.instances,
          ...currStateItem ? [{ ...basicInfo, children: [currStateItem] }] : [],
        ],
      });

      message.success(i18n.translate('MERGE_SUCCESS'));
    } else {
      message.warn(i18n.translate('MERGE_WITH_HOLE'));
    }
  }

  subtractPolygon = () => {
    if (
      this.rootStore.readonly ||
      this.rootStore.config.isAnyModalOpened ||
      this.isDrawing ||
      this.selectedShapes.length !== 1 ||
      this.selectedShapes[0].shapeType !== ShapeType.POLYGON
    ) {
      return;
    }

    const selectedPolygon = this.selectedShapes[0] as Polygon;
    const shapes = this.getShapesForCamera(this.rootStore.frame.currentCamera).map((i) => i.shape);
    const intersectPolygons = selectedPolygon.findIntersectPolygons(shapes, true).map((i) => this.shapes[i].shape);
    const subtractedData = selectedPolygon.subtract(intersectPolygons);

    if (subtractedData && subtractedData.length > 0) {
      this.updatePolygons(subtractedData[0][0], subtractedData.slice(1).map((d) => d[0]));
      message.success(i18n.translate('SUBTRACT_SUCCESS'));
    } else {
      message.warn(i18n.translate('SUBTRACT_NO_INTERSECT'));
    }
  };

  updatePolygons(currPolygonData: PolygonData, otherPolygonData: PolygonData[]) {
    this.updateShapes(currPolygonData, otherPolygonData, ShapeType.POLYGON);
  }

  updateShapes(currShapeData: ShapeData, otherShapeData: ShapeData[], shapeType = ShapeType.POLYGON) {
    const selectedShape = this.selectedShapes[0];
    const { instanceItem: selectedInstanceItem } = this.shapes[selectedShape.uid];
    const { currentCamera, currentFrame } = this.rootStore.frame;
    const attributes = selectedInstanceItem.cameras[currentCamera].frames[currentFrame].attributes;

    const prevBasicInfo = selectedInstanceItem.instance.getBasicInfo();
    const { prevState: prevStateItem, currState: currStateItem } = selectedInstanceItem.updateShape(
      currentCamera,
      currentFrame,
      true,
      shapeType,
      currShapeData,
      this.rootStore.frame.getNextShapeOrder(),
      attributes,
    );

    const basicInfo = selectedInstanceItem.instance.getBasicInfo();
    const instanceState: Record<string, { prev: IInstance, curr: IInstance }> = {
      [basicInfo.id]: {
        prev: { ...prevBasicInfo, children: prevStateItem ? [prevStateItem] : [] },
        curr: { ...basicInfo, children: currStateItem ? [currStateItem] : [] }
      }
    };

    this.setupShape(selectedInstanceItem);

    for (let i = 0; i < otherShapeData.length; i += 1) {
      const instanceItem = this.rootStore.instance.getCurrentInstanceItem(selectedInstanceItem.instance.category, selectedInstanceItem.name);

      const prevInfo = instanceItem.instance.getBasicInfo();
      if (instanceItem.instance !== selectedInstanceItem.instance) {
        instanceItem.instance.setAttributes(selectedInstanceItem.instance.attributes);
        const dynamicAttributesCurrentFrame = selectedInstanceItem.instance.dynamicAttributes?.[currentCamera]?.[currentFrame];
        if (dynamicAttributesCurrentFrame && instanceItem.instance.categoryRef.labelConfigDynamic) {
          instanceItem.instance.setDynamicAttributesByCamera(currentCamera, [dynamicAttributesCurrentFrame]);
        }
      }

      const { prevState, currState } = instanceItem.updateShape(
        currentCamera,
        currentFrame,
        true,
        shapeType,
        otherShapeData[i],
        this.rootStore.frame.getNextShapeOrder(),
        attributes,
      );
      this.setupShape(instanceItem);
      const currInfo = instanceItem.instance.getBasicInfo();
      if (!instanceState[currInfo.id]) {
        instanceState[currInfo.id] = {
          prev: { ...prevInfo, children: [] },
          curr: { ...currInfo, children: [] }
        };
      }
      const state = instanceState[currInfo.id];
      if (prevState) {
        state.prev.children.push(prevState);
      }
      if (currState) {
        state.curr.children.push(currState);
      }
    }
    this.selectShapeByInstanceItem(selectedInstanceItem);
    this.rootStore.undo.push({
      instances: Object.values(instanceState).map((i) => i.prev).filter((i) => i.children.length > 0)
    }, {
      instances: Object.values(instanceState).map((i) => i.curr)
    });
  }

  updateConfig = ({ fill, alpha, showVertex, showVertexOrder }: {
    fill?: boolean,
    alpha?: number,
    showVertex?: boolean,
    showVertexOrder?: boolean,
  }) => {
    if (fill !== undefined) {
      this.config.fill = fill;
      this.updateShapesFill(fill);
    }
    if (alpha !== undefined) {
      this.config.alpha = alpha;
      this.updateShapesAlpha(alpha / 100);
    }
    if (showVertex !== undefined) {
      this.config.showVertex = showVertex;
      this.updateShowVertex(showVertex);
    }
    if (showVertexOrder !== undefined) {
      this.config.showVertexOrder = showVertexOrder;
      this.updateShowVertexOrder(showVertexOrder);
    }
  };

  updateShapesFill = (fill: boolean) => {
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.alpha = fill ? this.config.alpha / 100 : 0;
    });
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.alpha = fill ? this.config.alpha / 100 : 0;
    });
  };

  updateShapesAlpha = (alpha: number) => {
    if (this.config.fill) {
      if (this.drawingShape) {
        this.drawingShape.alpha = alpha;
      }
      Object.values(this.shapes).forEach(({ shape }) => {
        shape.alpha = alpha;
      });
      Object.values(this.predictedShapes).forEach(({ shape }) => {
        shape.alpha = alpha;
      });
    }
  };

  updateShowVertex = (showVertex: boolean) => {
    if (this.drawingShape) {
      this.drawingShape.showVertex = showVertex;
    }
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.showVertex = showVertex;
    });
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.showVertex = showVertex;
    });
  };

  updateShowVertexOrder = (showVertexOrder: boolean) => {
    if (this.drawingShape) {
      this.drawingShape.showVertexOrder = showVertexOrder;
    }
    Object.values(this.shapes).forEach(({ shape }) => {
      shape.showVertexOrder = showVertexOrder;
    });
    Object.values(this.predictedShapes).forEach(({ shape }) => {
      shape.showVertexOrder = showVertexOrder;
    });
  };

  resetConfig = () => {
    this.updateConfig({ ...this.defaultConfig });
  };
}
