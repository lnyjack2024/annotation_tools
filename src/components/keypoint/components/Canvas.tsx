/* eslint-disable no-param-reassign */
import React from 'react';
import { observable, action, makeObservable, computed, reaction } from 'mobx';
import { observer } from 'mobx-react';
import Paper from 'paper';
import { debounce } from 'lodash';
import hexToRgba from 'hex-to-rgba';
import imageLoader from 'blueimp-load-image';
import ImageFilters from 'canvas-filters';
import ResizeObserver from 'resize-observer-polyfill';
import { Spin, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Tool, { ToolEventExtend, ToolProps } from '../tools/Tool';
import { OntologyChild } from '../store/OntologyStore';
import { AttributesMode } from '../store/SettingsStore';
import rootStore from '../store/RootStore';
import formatMessage from '../locales';
import {
  Point, PointStatus, CategoryItem, CategoryPathShape,
  Group, LandmarkEditType, ShapeInfo, GroupInfo, InstanceAct,
  PointInfo, UpdatedShape, Rectangle, KeypointCategoryProps,
  LabelStyle, PathStyles, Handle,
} from '../types';
import Cursor from '../../common/Cursor';
import { resetAttrLabelPosition, getValuesLabel, resizeLabel } from '../utils';
import { computeRotatedPosition } from '../../../utils/math';
import { IWarning } from '../../common/tabs-menu/Validator';
import './Canvas.scss';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 100;
const GRID_GAP = 10;
const GRID_LINE_WIDTH = 1;
const FONT_SIZE = 12;
export const POINT_COLOR = '#5cdef0';
const KEY_POINT_COLOR = '#ffb86d';
export const SHAPE_TYPE = {
  KEYPOINT: 'keypoint',
  PATH: 'path',
  KEYPOINT_BOX: 'keypoint_box',
  INSTANCE: 'instance',
  GROUP: 'group',
  RECTANGLE_POINT: 'rectangle_point',
  RECTANGLE_PATH: 'rectangle_path',
  RECTANGLE_GROUP: 'rectangle_group',
  RECTANGLE: 'rectangle',
  WARNGIN: 'warning'
};

enum LabelType {
  KEYPOINT='keypoint',
  OBJECT='object'
}

interface Props {
  image: string;
  readonly: boolean;
  loading: boolean;
  currentFrame: number;
  isReview: boolean;
  categories: CategoryItem[];
  updatedCategories: KeypointCategoryProps[];
  defaultInstances: {[id: string]: InstanceAct};
  selectedInstance?: InstanceAct;
  selectedGroupName?: string;
  ontologyGroup?: OntologyChild;
  annotatedPointOrShapeCount: number;
  selectedShapeStatus: ShapeInfo;
  selectedShapeInfo: PointInfo | GroupInfo | null;
  categoryPathShapes: {[categoryName: string]: CategoryPathShape};
  changeLoading: (loading: boolean) => void;
  selectGroup: (groupId: string, name: string, isFit?: boolean) => void;
  setSelectedShape: (selectedIndex?: number | string, data?: Group) => void;
  handleShapesChange: (shape: UpdatedShape[]) => void;
  handleShapesRemove: (shape: UpdatedShape[]) => void;
  togglePointsVisibility: (points: PointStatus[]) => void;
  setNextEmptyShape: () => void;
  onCategoriesUpdated: () => void;
  editShapeForm: () => void;
  editGroupForm: () => void;
  onSave: () => void;
  setCategoryPathShape: (categoryName: string, type?: CategoryPathShape, updatedShapes?: UpdatedShape[]) => void;
  getInstance: (id: string) => InstanceAct | undefined;
  handleUndo: () => void;
  handleRedo: () => void;
  setReview: () => void;
  handleChangeDrawMode: (mode: boolean) => void;
}

@observer
class Canvas extends React.Component<Props> {
  cursor = Cursor.DEFAULT;

  canvas: React.RefObject<HTMLCanvasElement> = React.createRef();

  canvasContainer: React.RefObject<HTMLDivElement> = React.createRef();

  imageCanvas: HTMLCanvasElement | undefined;

  imageData: ImageData | undefined;

  raster: paper.Raster | undefined;

  rasterLayer: paper.Layer | undefined;

  gridLayer: paper.Layer | undefined;

  labelLayer: paper.Layer | undefined;

  attrLayer: paper.Layer | undefined;

  mainLayer: paper.Layer | undefined;

  warningLayer: paper.Layer | undefined;

  tool: ToolProps | undefined;

  hits: paper.HitResult | undefined;

  selectedHit: paper.Item | undefined;

  warningBtn: paper.HitResult | undefined;

  selectedPoints: paper.Shape[] = [];

  selectedRectangles: paper.Group[] = [];

  smoothPath: paper.Path | null = null;

  shownLabel: paper.Group | null = null;

  fillOpacity = 0.3;

  resizeObserve: ResizeObserver | null = null;

  catchZoom: { zoom: number, center: paper.Point } | undefined;

  prevRaster: paper.Raster | null = null;

  resizeDebounced: any;

  paperZoom = 1;

  currentWarnings: IWarning[] = [];

  constructor(props: Props) {
    super(props);
    makeObservable(this, {
      cursor: observable,
      setCursor: action,
    });

    reaction(
      () => rootStore.review.qaWarnings,
      () => {
        this.drawWarnings();
      },
    );

    // change frame & undo & redo to update points
    reaction(
      () => rootStore.shape.updatedShapes,
      () => {
        this.updateShapes();
        this.drawWarnings();
      },
    );
  }

  @computed get activeTool() {
    let tool = '';
    switch (this.props.ontologyGroup?.type) {
      case LandmarkEditType.KEYPOINT:
        tool = CategoryPathShape.CIRCLE;
        break;
      case LandmarkEditType.RECTANGLE:
        tool = CategoryPathShape.RECTANGLE;
        break;
      default:
        break;
    }
    return tool;
  }

  componentDidMount() {
    if (this.canvas.current) {
      // init canvas
      Paper.setup(this.canvas.current);
      // setup layers
      this.setupLayers();
      // setuo tools
      this.setupTools();

      this.canvas.current.addEventListener('wheel', this.zoom, false);
      this.canvas.current.addEventListener('contextmenu', (e) => e.preventDefault(), false);
    }
    if (this.canvasContainer.current) {
      this.resizeObserve = new ResizeObserver(() => { this.resize(true); });
      this.resizeObserve.observe(this.canvasContainer.current);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.image !== this.props.image) {
      this.loadImage();
    }

    // default instances
    if (JSON.stringify(prevProps.defaultInstances) !== JSON.stringify(this.props.defaultInstances)) {
      const defaultInstances = Object.values(this.props.defaultInstances).filter((instance) => instance && !prevProps.defaultInstances[instance.id]);
      if (defaultInstances.length > 0) {
        defaultInstances.forEach((instance) => {
          const instanceContainer = new Paper.Group();
          this.mainLayer?.addChild(instanceContainer);
          instanceContainer.data = {
            instanceId: instance.id,
            category: instance.category,
            type: SHAPE_TYPE.INSTANCE,
          };
          instance.children.forEach((group) => {
            const groupContainer = new Paper.Group();
            groupContainer.data = {
              groupName: group.name,
              type: SHAPE_TYPE.GROUP,
              instanceId: instance.id,
              category: instance.category,
              displayColor: instance.displayColor || POINT_COLOR,
            };
            instanceContainer.addChild(groupContainer);
          });
        });
      }
    }

    if (
      JSON.stringify(prevProps.updatedCategories) !== JSON.stringify(this.props.updatedCategories) &&
      this.props.updatedCategories.length > 0
    ) {
      this.props.updatedCategories.forEach(({ pointCategory, frameIndex, instanceId, groupName, category }) => {
        if (frameIndex === this.props.currentFrame) {
          const container = { instanceId, groupName, category };
          const categoryKey = `${frameIndex}_${instanceId}_${groupName}_${pointCategory}`;
          this.updateCirclePath(pointCategory, this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE, container);
        }
      });
      this.props.onCategoriesUpdated();
    }

    // selected changes
    const isSelectedChange = JSON.stringify(prevProps.selectedShapeStatus) !== JSON.stringify(this.props.selectedShapeStatus);
    if (isSelectedChange) {
      if (this.selectedPoints.length <= 0 || this.selectedRectangles.length <= 0) {
        if (prevProps.selectedShapeStatus && prevProps.selectedShapeStatus.id !== undefined) {
          const { instanceId, groupName, id, shapeType } = prevProps.selectedShapeStatus;
          if (!this.isShapeInSelectedShapes(instanceId, groupName, id)) {
            if (shapeType === LandmarkEditType.KEYPOINT) {
              this.setPointSelected(instanceId, groupName, id as number, false);
            } else {
              this.selectShape(instanceId, groupName, id as string, false);
            }
          }
        }
      }
      const { instanceId, groupName, id, shapeType } = this.props.selectedShapeStatus;
      if (id !== undefined) {
        this.setMultiShapesUnselected();
        if (shapeType === LandmarkEditType.KEYPOINT) {
          this.setPointSelected(instanceId, groupName, id as number, true);
        } else {
          this.selectShape(instanceId, groupName, id as string);
        }
      }
    }
    if ((prevProps.selectedShapeInfo as PointInfo || {}).pointCategory !== (this.props.selectedShapeInfo as PointInfo || {}).pointCategory) {
      this.setSmooth(null);
      if (rootStore.setting.pathStyle === PathStyles.CURVES) {
        this.setSelectedCurves();
      }
    }
    if (
      this.props.selectedInstance && (
        isSelectedChange ||
        JSON.stringify(this.props.selectedInstance) !== JSON.stringify(prevProps.selectedInstance)
      )
    ) {
      const { instanceId, category, groupName } = this.props.selectedShapeStatus;
      this.updateGroupBox(instanceId, category, groupName);
    }
  }

  componentWillUnmount() {
    if (this.resizeObserve) {
      this.resizeObserve.disconnect();
      this.resizeObserve = null;
    }
  }

  setupLayers() {
    this.rasterLayer = new Paper.Layer();
    this.rasterLayer.applyMatrix = false;
    this.rasterLayer.visible = true;

    this.gridLayer = new Paper.Layer();
    this.gridLayer.applyMatrix = false;
    this.gridLayer.visible = rootStore.setting.isGridVisible;

    this.mainLayer = new Paper.Layer();
    this.mainLayer.applyMatrix = false;
    this.mainLayer.visible = false;

    this.labelLayer = new Paper.Layer();
    this.labelLayer.applyMatrix = false;
    this.labelLayer.visible = false;

    this.attrLayer = new Paper.Layer();
    this.attrLayer.applyMatrix = false;
    this.attrLayer.visible = false;

    this.warningLayer = new Paper.Layer();
    this.warningLayer.applyMatrix = false;
    this.warningLayer.visible = false;

    Paper.view.onMouseMove = this.hitTest;
  }

  setupTools() {
    this.tool = new Tool(this);
    this.tool.activate();
  }

  loadImage() {
    if (this.rasterLayer && this.props.image) {
      this.rasterLayer.activate();
      this.props.changeLoading(true);
      if (this.raster) {
        this.prevRaster = this.raster;
      }
      imageLoader(this.props.image, (c) => {
        const canvas = c as HTMLCanvasElement;
        this.imageCanvas = canvas;
        this.imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        this.raster = new Paper.Raster(canvas);
        this.raster!.visible = false;
        this.raster!.onLoad = () => {
          if (!this.gridLayer?.children?.length) {
            this.labelLayer!.visible = rootStore.setting.labelMode;
            this.mainLayer!.visible = true;
            this.warningLayer!.visible = true;
            this.attrLayer!.visible = true;
          }
          this.addGrid(); // add grid to image
          this.resize(); // resize to fit the container
          // when onload, show all layers
          this.raster!.visible = true;
          if (this.prevRaster) {
            this.prevRaster.remove();
          }
          this.props.changeLoading(false);
        };
      }, {
        canvas: true,
        orientation: true,
        crossOrigin: 'anonymous',
      });
    }
  }

  updateFilters() {
    if (this.imageData && this.raster) {
      let data = this.imageData;
      const { brightness, contrast, saturation, lightness, hue, rescale } = rootStore.setting.filters;
      if (brightness || contrast) {
        data = ImageFilters.BrightnessContrastPhotoshop(data, brightness, contrast);
      }
      if (rescale !== 1) {
        data = ImageFilters.Rescale(data, rescale);
      }
      if (hue || saturation || lightness) {
        data = ImageFilters.HSLAdjustment(data, hue, saturation, lightness);
      }
      this.raster.setImageData(data, new Paper.Point(0, 0));
    }
  }

  resize = (isWindow = false) => {
    if (this.canvasContainer.current) {
      // set view size
      const { offsetWidth: viewWidth, offsetHeight: viewHeight } = this.canvasContainer.current;
      Paper.view.viewSize = new Paper.Size(viewWidth, viewHeight);
      const viewCenter = new Paper.Point({ x: viewWidth / 2, y: viewHeight / 2 });
      if (this.catchZoom) {
        const { center, zoom } = this.catchZoom;
        if (isWindow) {
          Paper.view.center = viewCenter;
          this.catchZoom.center = viewCenter;
        } else {
          Paper.view.center = center;
        }
        Paper.view.zoom = zoom;
      } else {
        Paper.view.center = viewCenter;
        Paper.view.zoom = 1;
      }

      if (this.imageCanvas && this.raster) {
        // resize image
        const { width: imgWidth, height: imgHeight } = this.imageCanvas;
        const viewRatio = viewWidth / viewHeight;
        const imgRatio = imgWidth / imgHeight;
        const scaleFactor = (viewRatio < imgRatio ? viewWidth / imgWidth : viewHeight / imgHeight) * 0.98;
        const offsetX = (viewWidth - scaleFactor * imgWidth) / 2;
        const offsetY = (viewHeight - scaleFactor * imgHeight) / 2;
        const matrix = new Paper.Matrix().translate(offsetX, offsetY).scale(scaleFactor);
        // apply matrix to all layers
        Paper.project.layers.forEach((layer) => {
          layer.matrix = matrix;
        });
        // reset image center
        this.raster.position = new Paper.Point({ x: imgWidth / 2, y: imgHeight / 2 });
        this.paperZoom = this.rasterLayer ? Paper.view.zoom * this.rasterLayer.matrix.scaling.x : Paper.view.zoom;
      }
      this.resizeContent();
    }
  };

  resizeContent = () => {
    if (this.resizeDebounced) {
      this.resizeDebounced();
    } else {
      this.resizeDebounced = debounce(() => {
        this.resizeGrid();
        this.resizeShapes();
        this.drawWarnings();
      }, 50);
    }
  };

  zoom = (event: WheelEvent, zoom?: number) => {
    if (this.canvasContainer.current) {
      const mousePosition = new Paper.Point(event.offsetX, event.offsetY);
      const viewPosition = Paper.view.viewToProject(mousePosition);
      const oldZoom = Paper.view.zoom;
      const oldCenter = Paper.view.center;

      const { offsetWidth: viewWidth, offsetHeight: viewHeight } = this.canvasContainer.current;
      let newZoom = event && event.deltaY > 0 ? Paper.view.zoom * 1.1 : Paper.view.zoom / 1.1;
      newZoom = zoom || newZoom;
      if (newZoom <= 1) {
        Paper.view.center = new Paper.Point({ x: viewWidth / 2, y: viewHeight / 2 });
      }
      newZoom = Math.max(Math.min(newZoom, ZOOM_MAX), ZOOM_MIN);
      if (newZoom !== Paper.view.zoom) {
        Paper.view.zoom = newZoom;
        const zoomScale = oldZoom / newZoom;
        const offset = viewPosition.subtract(viewPosition.subtract(oldCenter).multiply(zoomScale)).subtract(oldCenter);
        Paper.view.center = Paper.view.center.add(offset);
      }
      this.catchZoom = { zoom: newZoom, center: Paper.view.center };
      this.paperZoom = newZoom * this.rasterLayer!.matrix.scaling.x;
      this.resizeContent();
    }
  };

  drag = (center: paper.Point) => {
    this.catchZoom = this.catchZoom ? {
      ...this.catchZoom,
      center,
    } : {
      zoom: Paper.view.zoom,
      center
    };
  };

  fitSelected = (instanceId: string, groupName?: string) => {
    const groupBox = groupName
      ? this.getGroupContainerByGroupName(instanceId, groupName)
      : this.getInstanceContainerByInstaceId(instanceId)?.children.find((g) => g.data.type === SHAPE_TYPE.GROUP);
    if (groupBox && this.mainLayer && this.canvasContainer.current) {
      const { center, width, height } = groupBox.bounds;
      if (width === 0 || height === 0) return;
      const point = this.mainLayer.localToGlobal(center);
      const { width: viewWidth, height: viewHeight } = this.mainLayer.bounds;

      let zoom = width / height > viewWidth / viewHeight ? viewWidth / width : viewHeight / height;
      zoom = Math.min(18, Math.max(zoom, 1));
      Paper.view.zoom = zoom;
      Paper.view.center = point;
      this.catchZoom = { zoom, center: point };
      this.paperZoom = this.rasterLayer ? zoom * this.rasterLayer.matrix.scaling.x : zoom;
      this.resizeContent();
    } else {
      this.resize();
    }
  };


  fitPoint = (point: { x: number; y: number }) => {
    if (this.mainLayer) {
      const center = this.mainLayer.localToGlobal(new Paper.Point(point.x, point.y));
      Paper.view.center = center;
      this.catchZoom = { zoom: Paper.view.zoom, center };
      this.resizeContent();
    }
  };

  addGrid() {
    if (this.gridLayer && this.imageCanvas) {
      this.gridLayer.removeChildren();
      const { width, height } = this.imageCanvas;
      const rows = Math.ceil(height / GRID_GAP);
      Array.from({ length: rows }).forEach((_, index) => {
        const path = new Paper.Path.Line({
          from: [0, index * GRID_GAP],
          to: [width, index * GRID_GAP],
          strokeColor: '#333333',
        });
        if (index % 4 === 0) {
          path.data.dashed = false;
        } else {
          path.data.dashed = true;
        }
        this.gridLayer?.addChild(path);
      });

      const cols = Math.ceil(width / GRID_GAP);
      Array.from({ length: cols }).forEach((_, index) => {
        const path = new Paper.Path.Line({
          from: [index * GRID_GAP, 0],
          to: [index * GRID_GAP, height],
          strokeColor: '#333333',
        });
        if (index % 4 === 0) {
          path.data.dashed = false;
        } else {
          path.data.dashed = true;
        }
        this.gridLayer?.addChild(path);
      });
    }
  }

  resizeGrid() {
    if (this.gridLayer && this.gridLayer.children && this.gridLayer.children.length > 0) {
      // keep grid line width looks the same
      const zoom = Paper.view.zoom * this.gridLayer.matrix.scaling.x;
      this.gridLayer.children.forEach((path) => {
        const baseWidth = GRID_LINE_WIDTH / zoom;
        if (path.data.dashed) {
          path.strokeWidth = baseWidth / 2;
          path.dashArray = [baseWidth * 4, baseWidth];
        } else {
          path.strokeWidth = baseWidth;
          path.dashArray = [];
        }
      });
    }
  }

  isShapeInSelectedShapes(instanceId: string, groupName: string, index: number | string | undefined) {
    return this.selectedPoints.findIndex((p) => p.data.instanceId === instanceId && p.data.groupName === groupName && p.data.index === index) >= 0 ||
    this.selectedRectangles.findIndex((p) => p.data.instanceId === instanceId && p.data.groupName === groupName && p.data.index === index) >= 0;
  }

  isPointInImage(point: paper.Point) {
    if (!this.imageCanvas || !this.rasterLayer) return false;
    const localPoint = this.rasterLayer.globalToLocal(Paper.view.viewToProject(point));
    const { bounds: { x, y, width, height } } = this.rasterLayer;
    return localPoint.x >= 0 && localPoint.x <= (x + width) && localPoint.y >= 0 && localPoint.y <= (y + height);
  }

  getPointInImage(point: paper.Point) {
    if (!this.imageCanvas || !this.rasterLayer) return point;

    const localPoint = this.rasterLayer.globalToLocal(Paper.view.viewToProject(point));
    /* const { width, height } = this.imageCanvas;

    if (localPoint.x < 0) {
      localPoint.x = 0;
    } else if (localPoint.x > width) {
      localPoint.x = width;
    }
    if (localPoint.y < 0) {
      localPoint.y = 0;
    } else if (localPoint.y > height) {
      localPoint.y = height;
    } */

    return localPoint;
  }

  getInstanceContainerByInstaceId(instaceId: string) {
    return this.mainLayer?.children.find((i) => i.data.type === SHAPE_TYPE.INSTANCE && i.data.instanceId === instaceId) as paper.Group;
  }

  getGroupContainerByGroupName(instaceId: string, groupName: string) {
    const instance = this.getInstanceContainerByInstaceId(instaceId);
    return instance?.children.find((g) => g.data.type === SHAPE_TYPE.GROUP && g.data.groupName === groupName) as paper.Group;
  }

  getShapeByKey(instaceId: string, groupName: string, key: string | number) {
    const group = this.getGroupContainerByGroupName(instaceId, groupName);
    return group?.children.find((p) => (p.data.type === SHAPE_TYPE.RECTANGLE_GROUP && p.data.id === key) ||
      (p.data.type === SHAPE_TYPE.KEYPOINT && p.data.index === key)) as paper.Group | paper.Shape;
  }

  getLabelByKey(instanceId: string, groupName: string, key: number | string) {
    return this.labelLayer?.children.find((l) => l.data.instanceId === instanceId && l.data.groupName === groupName && l.data.key === key) as paper.Group;
  }

  getAttrLabelByKey(instanceId: string, groupName: string, key: number | string) {
    return this.attrLayer?.children.find((l) => l.data.instanceId === instanceId && l.data.groupName === groupName && l.data.key === `attr-${key}`) as paper.Group;
  }

  getShapeByGroup() {
    return this.mainLayer?.children.find((l) => l.data.type === SHAPE_TYPE.KEYPOINT_BOX);
  }

  getPathByCategory(instaceId: string, groupName: string, pointCategory: string) {
    const group = this.getGroupContainerByGroupName(instaceId, groupName);
    return group?.children.find((p) => p.data.type === SHAPE_TYPE.PATH && p.data.pointCategory === pointCategory) as paper.Path;
  }

  getPathById(instaceId: string, groupName: string, pathId: string) {
    const group = this.getGroupContainerByGroupName(instaceId, groupName);
    return group?.children.find((p) => p.data.type === SHAPE_TYPE.PATH && p.data.id === pathId) as paper.Path;
  }

  getPointsByCategory(instaceId: string, groupName: string, pointCategory: string) {
    const group = this.getGroupContainerByGroupName(instaceId, groupName);
    return group?.children.filter((p) => p.data.type === SHAPE_TYPE.KEYPOINT && p.data.pointCategory === pointCategory);
  }

  canAddShape() {
    if (this.props.isReview || this.props.readonly || !rootStore.review.drawMode) return false;
    if (this.mainLayer && this.props.selectedShapeInfo) {
      if (this.props.selectedShapeInfo.shapeType === LandmarkEditType.RECTANGLE) {
        if (this.props.ontologyGroup && this.props.ontologyGroup.count > 0) {
          return this.props.annotatedPointOrShapeCount < this.props.ontologyGroup.count;
        }
      } else if (this.props.selectedShapeInfo.shapeType === LandmarkEditType.KEYPOINT) {
        const { instanceId, groupName, id } = this.props.selectedShapeStatus;
        if (id === undefined || id < 0) return false;
        const point = this.getShapeByKey(instanceId, groupName, id as number);
        return !point;
      }
    }
    return false;
  }

  containerAddPoint(groupData: GroupInfo, point: paper.Point, pointCategory: string, index: number, isKeyPoint: boolean, visible = true, attributes?: any) {
    const { instanceId, groupName } = groupData;
    const groupContainer = this.getGroupContainerByGroupName(instanceId, groupName);
    this.addKeypointShape(point, pointCategory, index, isKeyPoint, groupContainer, visible, attributes);
  };

  addKeypoint(point: paper.Point) {
    if (this.mainLayer && this.props.selectedShapeInfo && this.props.selectedShapeStatus && this.props.selectedInstance) {
      const { id, shapeType, frameIndex } = this.props.selectedShapeStatus;
      const index = (shapeType === LandmarkEditType.KEYPOINT && id as number) || 0;
      const { x, y } = this.mainLayer.globalToLocal(Paper.view.viewToProject(point));
      const newPoint = new Paper.Point(x, y);
      const { instanceId, category, groupName, pointCategory, isKeyPoint } = this.props.selectedShapeInfo as PointInfo;

      const categoryKey = `${frameIndex}_${instanceId}_${groupName}_${pointCategory}`;
      const groupData = { instanceId, groupName, type: LandmarkEditType.KEYPOINT, category: this.props.selectedInstance.category };
      this.containerAddPoint(groupData, newPoint, pointCategory, index, isKeyPoint);
      let otherPoints;
      if (this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE) {
        const container: Group = { instanceId, category, groupName };
        otherPoints = this.updateCirclePath(pointCategory, true, container);
      }
      this.props.handleShapesChange([{
        frameIndex,
        instanceId,
        category,
        groupName,
        index,
        shapeType: LandmarkEditType.KEYPOINT,
        shape: {
          pointCategory,
          isKeyPoint,
          position: { x, y },
          visible: true, // default is visible when point added
        },
      }, ...(otherPoints || [])]);
      this.props.setNextEmptyShape(); // move next
    }
  }

  addKeypointShape(point: paper.Point, pointCategory: string, pointIndex: number, isKeyPoint: boolean, groupContainer: paper.Group, visible: boolean, attributes?: any) {
    if (!groupContainer) return;
    const { frameIndex } = this.props.selectedShapeStatus;
    const { instanceId, groupName, category, displayColor } = groupContainer.data;
    if (this.mainLayer) {
      const zoom = Paper.view.zoom * this.mainLayer.matrix.scaling.x;
      // add point
      const pointColor = isKeyPoint ? KEY_POINT_COLOR : displayColor || POINT_COLOR;
      const fillColor = visible ? pointColor : '#3d424d';
      const pointCircle = new Paper.Shape.Circle({
        center: point,
        radius: (rootStore.setting.pointSize + 1) / zoom,
        fillColor,
        strokeColor: '#ffffff',
        strokeWidth: 1 / zoom,
        selectedColor: 'white',
      });
      pointCircle.data = {
        frameIndex,
        type: SHAPE_TYPE.KEYPOINT,
        cursor: Cursor.MOVE,
        pointCategory,
        index: pointIndex,
        isKeyPoint,
        visible,
        instanceId,
        groupName,
        category,
        fillColor,
      };
      groupContainer.addChild(pointCircle);

      // add point to path
      const groupData = rootStore.ontology.getGroupData(category, groupName);
      const categoryData = (groupData && groupData.categories && groupData.categories.find((v) => v.name === pointCategory)) || undefined;
      const segment = new Paper.Segment(point);
      let path = this.getPathByCategory(instanceId, groupName, pointCategory);
      const lineColor = categoryData?.isConnect === false ?
        new Paper.Color('rgba(0,0,0,0)') :
        new Paper.Color(displayColor || POINT_COLOR);
      let index = -1;
      if (path) {
        const { points, isCircle } = path.data;
        if (!isCircle) {
          if (rootStore.setting.pathStyle === PathStyles.CURVES) {
            for (let i = 0; i < points.length; i += 1) {
              const p = points[i];
              const nextP = points[i + 1];
              if (pointIndex > p && nextP > pointIndex) {
                // 2 => 1,3
                index = i + 1;
                break;
              } else if (
                pointIndex < p &&
                (!nextP || nextP > p || (nextP < p && i !== 0))) {
                // 9 => 10 || 10,18 || 10,5(end point)[not (end point)10,5]
                index = i;
                break;
              }
            }
          } else {
            index = path.data.points.findIndex((p: number) => pointIndex < p);
          }
          if (index < 0) {
            path.add(segment);
            index = path.data.points.push(pointIndex) - 1;
          } else {
            path.insert(index, segment);
            path.data.points.splice(index, 0, pointIndex);
          }
        }
      } else {
        path = new Paper.Path({
          segments: [segment],
          strokeWidth: rootStore.setting.lineWidth / zoom,
          strokeColor: lineColor,
          selectedColor: lineColor,
        });
        path.data = {
          type: SHAPE_TYPE.PATH,
          pointCategory,
          points: [pointIndex],
          instanceId,
          groupName,
          id: `${frameIndex}_${instanceId}_${groupName}_${pointCategory}`,
        };
        groupContainer.addChild(path);
      }
      this.toggleCurves(path);
      if (path === this.smoothPath) {
        this.setSmooth(path);
      }
      if (groupData && groupData.lines) {
        const lines = groupData.lines.filter((v) => v.points.indexOf(pointIndex) >= 0);
        const linesData: {isSource: boolean, fromTo: string, pathId: string}[] = [];
        lines.forEach((connectPoints) => {
          if (connectPoints) {
            const { points, color } = connectPoints;
            const isSource = pointIndex === points[0];
            const otherEnd = this.getShapeByKey(instanceId, groupName, isSource ? points[1] : points[0]);
            const fromTo = `${points[0]}-${points[1]}`;
            if (rootStore.setting.pathStyle === PathStyles.CURVES) {
              if (otherEnd) {
                const { pointCategory: otherCategory } = otherEnd.data;
                const [startPoint, endPoint] = isSource ? [pointCircle, otherEnd] : [otherEnd, pointCircle];
                const endSegment = new Paper.Segment(new Paper.Point(endPoint.position.x, endPoint.position.y));
                const line = isSource ? path : this.getPathByCategory(instanceId, groupName, otherCategory !== pointCategory ? otherCategory : '');
                if (line) {
                  const sourceIndex = line.data.points.findIndex((p: number) => points[0] === p);
                  if (sourceIndex === 0) {
                    line.insert(0, endSegment);
                    line.data.points.unshift(points[1]);
                  } else if (sourceIndex === line.data.points.length - 1) {
                    line.add(endSegment);
                    line.data.points.push(points[1]);
                  }
                  this.toggleCurves(line);
                  if (!endPoint.data.lines) {
                    endPoint.data.lines = [];
                  }
                  endPoint.data.lines.push({ isSource: false, fromTo, pathId: line.data.id });
                  startPoint.data.lines = [...startPoint.data.lines || [], { isSource: true, fromTo, pathId: line.data.id }];
                }
              }
            } else {
              linesData.push({ isSource, fromTo, pathId: fromTo });
              if (otherEnd) {
                const segments = isSource ? [segment, otherEnd.position] : [otherEnd.position, segment];
                const line = new Paper.Path({
                  segments,
                  strokeWidth: rootStore.setting.lineWidth / zoom,
                  strokeColor: color,
                  selectedColor: color,
                });
                line.data = {
                  type: SHAPE_TYPE.PATH,
                  pointCategory: fromTo,
                  points,
                  instanceId,
                  groupName,
                  id: fromTo,
                };
                groupContainer.addChild(line);
              }
            }
          }
        });
        if (rootStore.setting.pathStyle !== PathStyles.CURVES) {
          pointCircle.data.lines = linesData;
        }
      }
      path.sendToBack();
      const groupInfo = rootStore.ontology.getGroupData(category, groupName);
      const label = `${visible ? 1 : 0}-${pointIndex}`;
      let attrsLabel = getValuesLabel(groupInfo?.point_label_config?.fields, attributes, rootStore.setting.labelItems);
      attrsLabel = `${rootStore.setting.displayPointIndex ? `${pointIndex}` : ''}${rootStore.setting.displayPointIndex && attrsLabel ? ';' : ''}${attrsLabel}`;

      this.addLabel(
        label,
        { x: point.x, y: point.y, width: rootStore.setting.pointSize / zoom, height: rootStore.setting.pointSize / zoom },
        { instanceId, category, groupName },
        pointIndex,
        visible,
        SHAPE_TYPE.KEYPOINT,
        attrsLabel
      );
    }
  }

  removePointShape(containerData: Group, pointIndex: number) {
    const { instanceId, groupName } = containerData;
    if (this.mainLayer) {
      const point = this.getShapeByKey(instanceId, groupName, pointIndex);
      if (point) {
        const { lines, pointCategory } = point.data;
        point.remove();
        // remove pointCategory path
        const path = this.getPathByCategory(instanceId, groupName, pointCategory);
        if (path && !path.data.isCircle) {
          const index = path.data.points.findIndex((p: number) => p === pointIndex);
          if (index >= 0) {
            path.removeSegment(index);
            path.data.points.splice(index, 1);
          }
        }
        // remove group connect path
        if (lines) {
          (lines as { isSource: boolean, fromTo: string, pathId: string }[]).forEach(({ pathId, fromTo, isSource }) => {
            const line = this.getPathById(instanceId, groupName, pathId);
            if (rootStore.setting.pathStyle === PathStyles.CURVES) {
              let index = line?.data.points.findIndex((p: number) => p === pointIndex);
              if (isSource && index < 0) {
                index = line.data.points.findIndex((p: number) => p === Number(fromTo.split('-')[1] || -1));
              }
              if (index >= 0) {
                line.removeSegment(index);
                line.data.points.splice(index, 1);
                this.toggleCurves(line);
              }
            } else {
              line?.remove();
            }
          });
        }
      }
    }
    this.removeLabel(instanceId, groupName, pointIndex);
  }

  resizeShapes() {
    if (this.mainLayer && this.mainLayer.children && this.mainLayer.children.length > 0) {
      this.mainLayer.children.forEach((instance) => {
        if (instance.children && instance.children.length > 0) {
          instance.children.forEach((group) => {
            if (group.children) {
              group.children.forEach((path) => {
                if (path.data.type === SHAPE_TYPE.KEYPOINT) {
                  path.set({ radius: rootStore.setting.pointSize / this.paperZoom });
                  path.strokeWidth = 1 / this.paperZoom;
                } else if (path.data.type === SHAPE_TYPE.PATH) {
                  path.strokeWidth = rootStore.setting.lineWidth / this.paperZoom;
                } else if (path.data.type === SHAPE_TYPE.RECTANGLE_GROUP && path.children) {
                  path.children.forEach((shape) => {
                    if (shape.data.type === SHAPE_TYPE.RECTANGLE_POINT) {
                      shape.set({ radius: (rootStore.setting.pointSize / 2) / this.paperZoom });
                    } else if (shape.data.type === SHAPE_TYPE.RECTANGLE_PATH) {
                      shape.strokeWidth = rootStore.setting.lineWidth / this.paperZoom;
                    }
                  });
                }
              });
            }
          });
        } else if (instance.data.type === SHAPE_TYPE.KEYPOINT_BOX) {
          instance.strokeWidth = rootStore.setting.lineWidth / this.paperZoom;
        }
      });
    }
    if (this.labelLayer?.children && this.labelLayer.children.length > 0) {
      this.labelLayer.children.forEach((label) => {
        const { zoom: oldZoom, width, height, point } = label.data;
        resizeLabel({ width, height, zoom: this.paperZoom, fontSize: FONT_SIZE }, oldZoom, point, label, 'label');
      });
    }

    if (this.attrLayer?.children && this.attrLayer.children.length > 0) {
      this.attrLayer.children.forEach((label) => {
        const { zoom: oldZoom, width, height, point } = label.data;
        resizeLabel({ width, height, zoom: this.paperZoom, fontSize: FONT_SIZE }, oldZoom, point, label, 'attr');
      });
    }
    const { instanceId, groupName, id } = this.props.selectedShapeStatus;
    this.setPointSelected(instanceId, groupName, id as number, true);
  }

  cleanLayer() {
    if (this.mainLayer) {
      this.mainLayer.children?.forEach((container) => {
        if (container.data.type === SHAPE_TYPE.KEYPOINT_BOX) {
          container.remove();
        } else {
          container.children?.forEach((group) => {
            group?.removeChildren();
          });
        }
      });
    }
    if (this.labelLayer) {
      this.labelLayer.removeChildren();
    }

    if (this.attrLayer) {
      this.attrLayer.removeChildren();
    }

    if (this.warningLayer) {
      this.warningLayer.removeChildren();
    }
  }

  addLabel(content: string, shape: {x: number, y: number, width: number, height: number}, groupInfo: Group, key: number | string, visible: boolean, shapeType: string, attrsLabel?: string) {
    if (this.labelLayer) {
      const { instanceId, groupName } = groupInfo;
      const fontSize = FONT_SIZE / this.paperZoom;
      const label = new Paper.PointText({
        content,
        fontSize,
        fillColor: visible ? 'white' : 'red',
        shadowColor: '#000000',
        shadowBlur: 2 / this.paperZoom,
        shadowOffset: 2 / this.paperZoom,
      });
      const width = label.bounds.width + fontSize / 2;
      const height = label.bounds.height + fontSize / 2;
      const labelRect = new Paper.Shape.Rectangle({
        size: [width, height],
        fillColor: rootStore.setting.labelBgColor,
      });
      label.position.x = labelRect.bounds.width / 2;
      label.position.y = labelRect.bounds.height / 2;

      const labelGroup = new Paper.Group();
      labelGroup.data = {
        point: [shape.x, shape.y],
        instanceId,
        groupName,
        key,
        type: shapeType === SHAPE_TYPE.KEYPOINT ? LabelType.KEYPOINT : LabelType.OBJECT,
        zoom: this.paperZoom,
        height,
        width
      };
      if (rootStore.setting.labelStyle === LabelStyle.DEFAULT) {
        labelGroup.addChild(labelRect);
      }
      labelGroup.addChild(label);
      this.labelLayer.addChild(labelGroup);
      labelGroup.position.x = shape.x + labelRect.bounds.width / 2;
      labelGroup.position.y = shape.y - labelRect.bounds.height / 2 - rootStore.setting.lineWidth / this.paperZoom;

      if (shapeType !== SHAPE_TYPE.KEYPOINT_BOX && this.attrLayer) {
        let center = { x: shape.x, y: shape.y };

        if (SHAPE_TYPE.RECTANGLE) {
          center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
        }
        const arrtLabelGroup = labelGroup.clone();
        arrtLabelGroup.data.key = `attr-${arrtLabelGroup.data.key}`;
        arrtLabelGroup.data.point = [center.x, center.y];
        arrtLabelGroup.children.slice(-1)[0].fillColor = new Paper.Color('#ffffff');
        (arrtLabelGroup.children.slice(-1)[0] as paper.PointText).content = '';
        this.attrLayer.addChild(arrtLabelGroup);
        if (attrsLabel) {
          this.updateLabelContent(arrtLabelGroup, attrsLabel, shapeType);
        } else {
          arrtLabelGroup.visible = false;
        }
      }
    }
  }

  updateLabel(instanceId: string, groupName: string, key: number | string, position: { x: number, y: number }, center: { x: number, y: number }) {
    if (this.labelLayer) {
      const label = this.getLabelByKey(instanceId, groupName, key);
      if (label) {
        label.data.point = [position.x, position.y];
        label.position.x = position.x + label.bounds.width / 2;
        label.position.y = position.y - label.bounds.height / 2;
      }
    }
    if (this.attrLayer) {
      const label = this.getAttrLabelByKey(instanceId, groupName, key);
      if (label) {
        label.data.point = [center.x, center.y];
        label.position.x = center.x;
        label.position.y = center.y;
      }
    }
  }

  updateAttributeLabel(instanceId: string, category: string, groupName: string, key: number | string, attributes: any, instanceNum?: number) {
    const groupInfo = rootStore.ontology.getGroupData(category, groupName);
    let label = '';
    if (typeof key === 'number') {
      label = getValuesLabel(groupInfo?.point_label_config?.fields, attributes, rootStore.setting.pointLabelItems);
      label = `${rootStore.setting.displayPointIndex ? `${key}` : ''}${rootStore.setting.displayPointIndex && label ? ';' : ''}${label}`;
    } else {
      const categoryLabel = `${groupInfo?.class_display_name || ''}  ${instanceNum || ''}-${groupInfo?.display_name || groupInfo?.name || ''}`;
      label = getValuesLabel(groupInfo?.label_config?.fields, attributes, rootStore.setting.labelItems);
      label = `${rootStore.setting.displayCategory ? `${categoryLabel}` : ''}${rootStore.setting.displayCategory && label ? ';' : ''}${label}`;
    }
    const attrLayer = this.getAttrLabelByKey(instanceId, groupName, key);
    if (attrLayer) {
      if (label) {
        this.updateLabelContent(attrLayer, label, SHAPE_TYPE.KEYPOINT);
      } else {
        attrLayer.visible = false;
      }
    }
  }

  updateLabelContent(label: paper.Group, content: string, shapeType: string) {
    if (this.attrLayer && label) {
      const zoom = Paper.view.zoom * this.attrLayer.matrix.scaling.x;
      const labelText = label.children.slice(-1)[0];
      (labelText as paper.PointText).content = content;
      const { width, height } = labelText.bounds;
      const fontSize = FONT_SIZE / zoom;
      if (rootStore.setting.labelStyle === LabelStyle.DEFAULT) {
        (label.children[0] as paper.Shape).size.height = height + fontSize / 2;
        (label.children[0] as paper.Shape).size.width = width + fontSize / 2;
      }
      label.data.width = label.children[0].bounds.width;
      label.data.height = label.children[0].bounds.height;
      label.data.zoom = this.paperZoom;

      let visible = false;
      if (shapeType === SHAPE_TYPE.KEYPOINT) {
        visible = rootStore.setting.activePointAttributesMode === AttributesMode.ALWAYS;
      } else if (SHAPE_TYPE.RECTANGLE) {
        visible = rootStore.setting.activeAttributesMode === AttributesMode.ALWAYS;
      }
      if (visible) {
        const { point } = label.data;
        resetAttrLabelPosition(label, { x: point[0], y: point[1] }, visible);
      } else {
        label.visible = false;
      }
    }
  }

  updatelabelVisible(activeMode: AttributesMode, type = 'object') {
    if (this.shownLabel) {
      this.shownLabel.visible = false;
      this.shownLabel = null;
    }
    if (this.attrLayer?.children && this.attrLayer.children.length > 0) {
      this.attrLayer.children.forEach((label) => {
        const { type: labelType } = label.data;
        if (type === labelType) {
          label.visible = activeMode === AttributesMode.ALWAYS;
        }
      });
    }
  }

  removeLabel(instanceId: string, groupName: string, key: string | number) {
    if (this.labelLayer) {
      const label = this.getLabelByKey(instanceId, groupName, key);
      if (label) {
        label.remove();
      }
    }
    if (this.attrLayer) {
      const label = this.getAttrLabelByKey(instanceId, groupName, key);
      if (label) {
        label.remove();
      }
    }
  }

  updateShapes() {
    const { currentFrame } = this.props;
    const { shape: { updatedShapes } } = rootStore;
    updatedShapes.forEach((updatedShape) => {
      if (updatedShape.frameIndex !== currentFrame) return;
      switch (updatedShape.shapeType) {
        case LandmarkEditType.KEYPOINT:
          this.updatePoint(updatedShape);
          break;
        case LandmarkEditType.RECTANGLE:
          this.updateRectangle(updatedShape);
          break;
        default:
          break;
      }
    });
    rootStore.shape.setUpdatedShapes([]);
    const { instanceId, category, groupName } = this.props.selectedShapeStatus;
    this.updateGroupBox(instanceId, category, groupName);
  }

  updateRectangle(updateShape: UpdatedShape) {
    const { instanceId, groupName, category, id, shape } = updateShape;
    if (id !== undefined) {
      const rectangle = shape as Rectangle;
      const currRectangle = this.getShapeByKey(instanceId, groupName, id);
      if (currRectangle) {
        // alreay exist, should update
        if (rectangle === undefined) {
          // delete
          this.removeRectangle(instanceId, groupName, id);
        } else if (rectangle.x) {
          const { x, y, width, height, displayColor } = rectangle;
          // update position
          this.drawRectangle({ x, y, width, height, displayColor }, { instanceId, category, groupName }, id);
        }
      } else if (rectangle) {
        //  has been removed, should add
        const { x, y, width, height, displayColor } = rectangle;
        const path = new Paper.Path();
        path.data.id = id;
        path.add(new Paper.Point(x, y));
        path.add(new Paper.Point(x + width, y));
        path.add(new Paper.Point(x + width, y + height));
        path.add(new Paper.Point(x, y + height));
        path.closed = true;
        this.addRectangle(path, { instanceId, groupName, category, shapeType: LandmarkEditType.RECTANGLE, displayColor }, false);
      }
    }
  }

  updatePoint(updateShape: UpdatedShape) {
    const { frameIndex, instanceId, groupName, category, index, shape } = updateShape;
    if (index !== undefined) {
      let updatedCategorie: KeypointCategoryProps | undefined;
      const point = shape as Point;
      const currPoint = this.getShapeByKey(instanceId, groupName, index) as paper.Shape;
      if (currPoint) {
        const currCategory = currPoint.data.pointCategory;
        updatedCategorie = { pointCategory: currCategory, frameIndex, instanceId, groupName, category };
        const groupData = { frameIndex, instanceId, category, groupName };
        // alreay exist, should update
        if (point === undefined) {
          // delete
          this.removePointShape(groupData, index);
        } else if (point.position && point.pointCategory) {
          // update position
          currPoint.position.x = point.position.x;
          currPoint.position.y = point.position.y;
          this.updatePath(currPoint, point.position);
          // update visible
          if (point.visible !== undefined && currPoint.data.visible !== point.visible) {
            this.changeVisibleStyle(currPoint, index, groupData, point.visible);
          }
          if (rootStore.setting.activePointAttributesMode !== AttributesMode.HIDE) {
            this.updateAttributeLabel(instanceId, category, groupName, index, point.attributes);
          }
        }
      } else if (point) {
        //  has been removed, should add
        const { position, pointCategory, isKeyPoint, visible, attributes } = point;
        if (position !== undefined && pointCategory !== undefined && index !== undefined && isKeyPoint !== undefined) {
          updatedCategorie = { pointCategory, frameIndex, instanceId, groupName, category };
          const groupData = { instanceId, groupName, type: LandmarkEditType.KEYPOINT, category };
          this.containerAddPoint(groupData, new Paper.Point(position.x, position.y), pointCategory, index, isKeyPoint, visible, attributes);
        }
      }
      if (updatedCategorie) {
        const { pointCategory, ...newContainer } = updatedCategorie;
        const categoryKey = `${frameIndex}_${newContainer.instanceId}_${newContainer.groupName}_${pointCategory}`;
        if (this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE) {
          this.updateCirclePath(pointCategory, this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE, newContainer);
        }
      }
    }
  }

  updatePath(
    point: paper.Shape,
    position: { x: number, y: number },
  ) {
    const { instanceId, groupName, pointCategory, index, lines } = point.data;
    const path = this.getPathByCategory(instanceId, groupName, pointCategory);
    if (path && !path.data.isCircle) {
      const segmentIndex = path.data.points.findIndex((p: number) => p === index);
      path.segments[segmentIndex].point.x = position.x;
      path.segments[segmentIndex].point.y = position.y;
      this.toggleCurves(path);
    }
    // change connect line position
    if (lines) {
      (lines as {isSource: boolean, pathId: string}[]).forEach(({ isSource, pathId }) => {
        const line = this.getPathById(instanceId, groupName, pathId);
        if (line) {
          let n = -1;
          if (rootStore.setting.pathStyle === PathStyles.CURVES) {
            n = !isSource ? line.data.points.findIndex((p: number) => p === index) : -1;
          } else {
            n = isSource ? 0 : 1;
            if (!line.segments[n]) {
              n = 0;
            }
          }
          if (n >= 0) {
            line.segments[n].point.x = position.x;
            line.segments[n].point.y = position.y;
            this.toggleCurves(line);
          }
        }
      });
    }
    this.updateLabel(
      instanceId,
      groupName,
      index,
      position,
      position,
    );
  }

  setPointSelected(instanceId: string, groupName: string, index: number, selected: boolean) {
    if (this.mainLayer?.children && this.mainLayer.children.length > 0) {
      const point = this.getShapeByKey(instanceId, groupName, index) as paper.Shape;
      if (point) {
        const zoom = Paper.view.zoom * this.mainLayer.matrix.scaling.x;
        if (selected) {
          point.strokeWidth = 3 / zoom;
          point.radius = (rootStore.setting.pointSize + 1) / zoom;
        } else {
          point.radius = rootStore.setting.pointSize / zoom;
          point.strokeWidth = 1 / zoom;
        }
      }
    }
  }

  setMultiShapesSelected(selectedShapes: (paper.Shape | paper.Group)[], type: CategoryPathShape) {
    if (selectedShapes.length > 0) {
      const { instanceId, groupName } = selectedShapes[0].data;
      this.props.selectGroup(instanceId, groupName, false);
      this.props.setSelectedShape(undefined);
    }
    if (type === CategoryPathShape.CIRCLE) {
      this.selectedPoints = (selectedShapes as paper.Shape[]).sort((a, b) => a.data.index - b.data.index);
      rootStore.shape.setMultiSelectedShape(this.selectedPoints.map((point) => (point as paper.Shape).data.index));
      this.selectedPoints.forEach((point) => {
        const pData = point.data;
        this.setPointSelected(pData.instanceId, pData.groupName, pData.index, true);
      });
    } else {
      this.selectedRectangles = selectedShapes as paper.Group[];
      this.selectedRectangles.forEach((rectangle) => {
        const rData = rectangle.data;
        this.selectShape(rData.instanceId, rData.groupName, rData.id);
      });
    }
  }

  setMultiShapesUnselected() {
    this.selectedPoints.forEach((point) => {
      const { instanceId, groupName, index } = point.data;
      this.setPointSelected(instanceId, groupName, index, false);
    });
    this.selectedRectangles.forEach((rectangle) => {
      const { instanceId, groupName, id } = rectangle.data;
      this.selectShape(instanceId, groupName, id, false);
    });

    this.selectedPoints = [];
    this.selectedRectangles = [];
    rootStore.shape.setMultiSelectedShape([]);
  }

  updatePointsPosition(shapes: UpdatedShape[]) {
    this.props.handleShapesChange(shapes);
  }

  // resize and drag, change label position
  updateRectanglePosition(shapes: UpdatedShape[]) {
    this.props.handleShapesChange(shapes);
    if (this.labelLayer) {
      shapes.forEach(({ instanceId, groupName, id, shape }) => {
        if (id && shape && (shape as Rectangle).x) {
          const { x, y, width, height } = shape as Rectangle;
          this.updateLabel(
            instanceId,
            groupName,
            id,
            { x, y },
            { x: x + width / 2, y: y + height / 2 },
          );
        }
      });
    }
  }

  deleteSelectedPoints() {
    const updatedCategories: KeypointCategoryProps[] = [];
    const points: UpdatedShape[] = [];
    (this.selectedPoints.length > 0 ? this.selectedPoints.map((p) => ({
      frameIndex: this.props.currentFrame,
      instanceId: p.data.instanceId,
      category: p.data.category,
      groupName: p.data.groupName,
      index: p.data.index,
      shapeType: LandmarkEditType.KEYPOINT
    })) : [{
      ...this.props.selectedShapeStatus,
      index: this.props.selectedShapeStatus.id,
      shapeType: LandmarkEditType.KEYPOINT
    }]).forEach((selectedShapeStatus) => {
      let enable = true;
      const { frameIndex, instanceId, groupName, index } = selectedShapeStatus;
      const point = typeof index === 'number' && this.getShapeByKey(instanceId, groupName, index);
      if (point && point.data) {
        const categoryKey = `${frameIndex}_${instanceId}_${groupName}_${point.data.pointCategory}`;
        if (this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE) {
          const path = this.getPathByCategory(instanceId, groupName, point.data.pointCategory);
          const instance = this.getInstanceContainerByInstaceId(instanceId);
          if (instance && path && path.data.isCircle) {
            const group = rootStore.ontology.getGroupData(instance.data.category, groupName);
            const pointCategory = group && group.categories && group.categories.length && group.categories.find((c) => c.name === point.data.pointCategory);
            if (pointCategory) {
              const sortedKeys = [...pointCategory.keys].sort((a, b) => a - b);
              const pIndex1 = sortedKeys[0];
              const pIndex2 = sortedKeys[Math.ceil(sortedKeys.length / 2)];
              if (index !== pIndex1 && index !== pIndex2) {
                enable = true;
              }
            }
          }
        }
        if (enable) {
          points.push({
            ...selectedShapeStatus,
            ...point.data
          });
        }
      }
    });
    this.props.handleShapesRemove(points);
    rootStore.handle.removeHandles(points);
    points.forEach(({ frameIndex, instanceId, category, groupName, index }) => {
      const instance = this.getInstanceContainerByInstaceId(instanceId);
      const point = this.getShapeByKey(instanceId, groupName, index!);
      if (instance && point && !updatedCategories.includes(point.data.pointCategory)) {
        updatedCategories.push({ pointCategory: point.data.pointCategory, frameIndex, instanceId, groupName, category: instance.data.category });
      }
      this.removePointShape({ instanceId, category, groupName }, index!);
    });
    updatedCategories.forEach(({ frameIndex, pointCategory, ...container }) => {
      const categoryKey = `${frameIndex}_${container.instanceId}_${container.groupName}_${pointCategory}`;
      this.updateCirclePath(pointCategory, this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE, container);
    });
    this.selectedPoints = [];
  }

  deleteSelectedRectangle() {
    const rectangles = (this.selectedRectangles.length > 0 ? this.selectedRectangles.map((rect) => ({
      frameIndex: rect.data.frameIndex,
      instanceId: rect.data.instanceId,
      category: rect.data.category,
      groupName: rect.data.groupName,
      id: rect.data.id,
      shapeType: LandmarkEditType.RECTANGLE
    })) : [{
      ...this.props.selectedShapeStatus,
      id: this.props.selectedShapeStatus.id,
      shapeType: LandmarkEditType.RECTANGLE
    }]).filter((v) => typeof v.id === 'string');
    this.props.handleShapesRemove(rectangles);
    rectangles.forEach(({ instanceId, groupName, id }) => {
      this.removeRectangle(instanceId, groupName, id);
    });
    this.selectedRectangles = [];
  };

  toggleSelectedPointVisibility() {
    const points = this.selectedPoints.length > 0 ?
      this.selectedPoints.map((p) => p.data) :
      [{ ...this.props.selectedShapeStatus, index: this.props.selectedShapeStatus.id }]
        .filter((v) => v.shapeType === LandmarkEditType.KEYPOINT);
    points.forEach(({ instanceId, category, groupName, index }) => {
      const point = this.getShapeByKey(instanceId, groupName, index) as paper.Shape;
      this.changeVisibleStyle(point, index, { instanceId, category, groupName, displayColor: point.data.fillColor }, !point.data.visible);
    });
    this.props.togglePointsVisibility(points);
  }

  changeVisibleStyle(point: paper.Shape, index: number, groupData: Group, visible: boolean) {
    const { instanceId, groupName } = groupData;
    const labelGroup = this.getLabelByKey(instanceId, groupName, index);
    if (point) {
      let fillColor = point.data.isKeyPoint ?
        KEY_POINT_COLOR :
        groupData?.displayColor || POINT_COLOR;
      let strokeColor = '#ffffff';
      if (!visible) {
        strokeColor = fillColor;
        fillColor = '#3d424d';
      }
      point.data.visible = visible;
      point.fillColor = new Paper.Color(fillColor);
      point.strokeColor = new Paper.Color(strokeColor);
    }
    if (this.labelLayer && labelGroup) {
      const label = labelGroup.children.length === 2 ? labelGroup.children[1] : labelGroup.children[0];
      (label as paper.PointText).content = `${visible ? '1' : '0'}-${index}`;
      label.fillColor = new Paper.Color(visible ? 'white' : 'red');
    }
  }

  hitTest = (event: ToolEventExtend) => {
    if (this.mainLayer && !this.tool?.mouseDown) {
      let cursor: Cursor = Cursor.DEFAULT;
      const isDrawPoint = this.props.selectedShapeStatus.shapeType === LandmarkEditType.KEYPOINT;
      if (this.canAddShape()) {
        cursor = isDrawPoint ? Cursor.POINTER : Cursor.CROSSHAIR;
      }
      if (this.selectedHit) {
        this.selectedHit.selected = false;
      }

      const hits = this.mainLayer.hitTestAll(event.point, {
        fill: true,
        selected: false,
        handles: true,
        stroke: true,
        tolerance: 10 / this.paperZoom,
        match: (ht: any) => {
          if (ht && ht.item && (ht.item.data.type === undefined || ht.item.data.type === SHAPE_TYPE.KEYPOINT_BOX)) {
            return false;
          }
          return true;
        }
      });
      let hit: paper.HitResult | undefined;
      for (let i = 0; i < hits.length; i += 1) {
        const h = hits[i];
        const { type } = h.item.data;
        if (
          !type ||
          (type !== SHAPE_TYPE.INSTANCE &&
          type !== SHAPE_TYPE.GROUP &&
          type !== SHAPE_TYPE.KEYPOINT_BOX &&
          type !== SHAPE_TYPE.RECTANGLE_GROUP) &&
          (
            type !== SHAPE_TYPE.PATH ||
            (type === SHAPE_TYPE.PATH && ['handle-in', 'handle-out'].includes(h.type)))
        ) {
          // select point | rectangle | rectangle control | path handle
          if ((type === SHAPE_TYPE.RECTANGLE || type === SHAPE_TYPE.RECTANGLE_POINT || type === SHAPE_TYPE.RECTANGLE_PATH)) {
            if ((i === 0) && !this.canAddShape()) {
              hit = h;
            }
          } else {
            hit = h;
            if (type === SHAPE_TYPE.KEYPOINT) {
              break;
            }
          }
        }
      }

      if (hit?.item && !event.event.ctrlKey) {
        if (
          !this.isShapeInSelectedShapes(hit.item.data?.instanceId, hit.item.data?.groupName, hit.item.data?.index) &&
          hit.item.data?.index !== this.props.selectedShapeStatus.id &&
          hit.item.data?.id !== this.props.selectedShapeStatus.id
        ) {
          this.selectedHit = hit.item;
          hit.item.selected = true;
        }
        if (hit.item.data.cursor) {
          cursor = hit.item.data.cursor;
        } else {
          cursor = Cursor.MOVE;
        }
        this.showShapeLabel(hit, event.point);
      } else if (this.shownLabel) {
        const { point } = this.shownLabel.data;
        resetAttrLabelPosition(this.shownLabel, { x: point[0], y: point[1] }, false);
      }
      this.hits = hit;
      if (this.currentWarnings.length > 0) {
        this.warningBtn = this.warningLayer?.hitTest(event.point);
      }
      if (this.smoothPath) {
        this.smoothPath.fullySelected = true;
      }
      this.setCursor(cursor);
    }
  };

  setCursor(cursor: Cursor) {
    this.cursor = cursor;
  }

  clearHits = () => {
    this.hits = undefined;
  };

  showShapeLabel(hits: paper.HitResult, point: paper.Point) {
    const { activePointAttributesMode, activeAttributesMode } = rootStore.setting;
    if (!activePointAttributesMode && !activeAttributesMode) return;
    const localPoint = this.getPointInImage(Paper.view.projectToView(point));
    const { data } = hits.item;
    let label;
    if (data.type === SHAPE_TYPE.KEYPOINT && activePointAttributesMode === AttributesMode.HOVER) {
      label = this.getAttrLabelByKey(data.instanceId, data.groupName, data.index);
    } else if (
      (data.type === SHAPE_TYPE.RECTANGLE || data.type === SHAPE_TYPE.RECTANGLE_PATH || data.type === SHAPE_TYPE.RECTANGLE_POINT) &&
      hits.item.parent &&
      activeAttributesMode === AttributesMode.HOVER
    ) {
      const { instanceId, groupName, id } = hits.item.parent.data;
      label = this.getAttrLabelByKey(instanceId, groupName, id);
    }
    if (label && (label.children?.slice(-1)[0] as paper.PointText).content) {
      if (this.shownLabel) {
        if (JSON.stringify(label) !== JSON.stringify(this.shownLabel)) {
          const { point: position } = this.shownLabel.data;
          resetAttrLabelPosition(this.shownLabel, { x: position[0], y: position[1] }, false);
          this.shownLabel = label;
        }
      } else {
        this.shownLabel = label;
      }
      this.shownLabel.visible = true;
      this.shownLabel.position.x = localPoint.x + 50 / Paper.view.zoom;
      this.shownLabel.position.y = localPoint.y + 50 / Paper.view.zoom;
    }
  }

  getNewPointsByKeyPointRange(path: paper.Path, startKey: number, endKey: number, instanceId: string, groupName: string) {
    const startPosition = this.getShapeByKey(instanceId, groupName, startKey).position;
    const endPosition = this.getShapeByKey(instanceId, groupName, endKey).position;
    const segmentLength = (path.getOffsetOf(endPosition) - path.getOffsetOf(startPosition)) / (endKey - startKey);
    let newPoints = {}; // new points position between start & end
    let base = startKey;
    let basePoint = startPosition;
    while (base < endKey - 1) {
      const baseOffset = path.getOffsetOf(basePoint);
      const nextPoint = path.getPointAt(baseOffset + segmentLength);
      newPoints = {
        ...newPoints,
        [base + 1]: nextPoint
      };
      base += 1;
      basePoint = nextPoint;
    }
    return newPoints;
  }

  getUpdatedPointsByNewPoints(newPoints: {[index: number]: paper.Point}, pointCategory: CategoryItem, parentData: Group) {
    const { instanceId, groupName, category } = parentData;
    const updatedShapes: UpdatedShape[] = [];
    const indexs = Object.keys(newPoints).map((v) => Number(v));
    for (let index = 0; index < indexs.length; index += 1) {
      const pointIndex = indexs[index];
      const existingPoint = this.getShapeByKey(instanceId, groupName, pointIndex) as paper.Shape;
      if (newPoints[pointIndex]) {
        const { x, y } = newPoints[pointIndex];
        const pointInfo = {
          frameIndex: this.props.selectedShapeStatus.frameIndex,
          instanceId,
          category,
          groupName,
          index: pointIndex,
          shapeType: LandmarkEditType.KEYPOINT,
        };
        if (existingPoint) {
          if (existingPoint.position.x !== x || existingPoint.position.y !== y) {
            // update position
            existingPoint.position.x = x;
            existingPoint.position.y = y;

            this.updatePath(existingPoint, { x, y });
            updatedShapes.push({
              ...pointInfo,
              shape: {
                position: { x, y }
              },
            });
          }
        } else {
          // add new point
          const isKeyPoint = pointCategory.keys.includes(pointIndex);
          const groupContainer = this.getGroupContainerByGroupName(instanceId, groupName);

          this.addKeypointShape(new Paper.Point(x, y), pointCategory.name, pointIndex, isKeyPoint, groupContainer, true);
          updatedShapes.push({
            ...pointInfo,
            shape: {
              pointCategory: pointCategory.name,
              isKeyPoint,
              position: { x, y },
              visible: true,
            },
          });
        }
      }
    }
    return updatedShapes;
  }

  autoAdjust(point = this.props.selectedShapeStatus) {
    if (this.props.selectedShapeInfo) {
      const { id } = point;
      const { instanceId, category, groupName, pointCategory: categoryName } = this.props.selectedShapeInfo as PointInfo;
      const categoryKey = `${this.props.currentFrame}_${instanceId}_${groupName}_${categoryName}`;
      const path = this.getPathByCategory(instanceId, groupName, categoryName); // pointCategory path
      const pointCategory = this.props.categories.find((c) => c.name === categoryName); // pointCategory definition
      if (path && pointCategory && this.props.categoryPathShapes[categoryKey] !== CategoryPathShape.CIRCLE) {
        // calc the prev & next key point index
        let prevKeyPointIndex: number | undefined;
        let nextKeyPointIndex: number | undefined;
        const { points = [] } = path.data;
        const { keys = [] } = pointCategory;
        const keysWithTwoSides = [
          ...(keys.includes(points[0]) ? [] : [points[0]]),
          ...keys,
          ...(keys.includes(points[points.length - 1]) ? [] : [points[points.length - 1]]),
        ].sort((a, b) => a - b);
        let keyIndex = keysWithTwoSides.findIndex((key) => key > Number(id));
        if (keyIndex < 0) { // not found, use the last point
          keyIndex = keysWithTwoSides.length - 1;
        }
        let i = keyIndex;
        while (i < keysWithTwoSides.length) {
          if (points.includes(keysWithTwoSides[i])) {
            nextKeyPointIndex = keysWithTwoSides[i];
            break;
          }
          i += 1;
        }
        i = keyIndex - 1;
        while (i >= 0) {
          if (points.includes(keysWithTwoSides[i])) {
            prevKeyPointIndex = keysWithTwoSides[i];
            break;
          }
          i -= 1;
        }
        // range found, continue
        if (prevKeyPointIndex !== undefined && nextKeyPointIndex !== undefined) {
          const newPoints = this.getNewPointsByKeyPointRange(path, prevKeyPointIndex, nextKeyPointIndex, instanceId, groupName);
          const parentData = { instanceId, category, groupName };
          const updatedShapes = this.getUpdatedPointsByNewPoints(newPoints, pointCategory, parentData);
          if (updatedShapes.length > 0) {
            this.props.handleShapesChange(updatedShapes);
          }
        }
      }
    }
  }

  switchSmoothMode() {
    if (this.props.selectedShapeInfo && rootStore.setting.pathStyle !== PathStyles.CURVES) {
      const { instanceId, category, groupName, pointCategory: categoryName } = this.props.selectedShapeInfo as PointInfo;
      const path = this.getPathByCategory(instanceId, groupName, categoryName);
      const categoryKey = `${this.props.currentFrame}_${instanceId}_${groupName}_${categoryName}`;
      if (path && this.props.categoryPathShapes[categoryKey] !== CategoryPathShape.CIRCLE) {
        if (path === this.smoothPath) {
          // ends
          const pointCategory = this.props.categories.find((c) => c.name === categoryName);
          if (pointCategory) {
            const keyPoints = pointCategory.keys.filter((k) => path.data.points.includes(k)).sort((a, b) => a - b);
            let updatedShapes: UpdatedShape[] = [];
            for (let i = 1; i < keyPoints.length; i += 1) {
              const newPoints = this.getNewPointsByKeyPointRange(path, keyPoints[i - 1], keyPoints[i], instanceId, groupName);
              const parentData = { instanceId, category, groupName };
              updatedShapes = [
                ...updatedShapes,
                ...this.getUpdatedPointsByNewPoints(newPoints, pointCategory, parentData),
              ];
            }
            if (updatedShapes.length > 0) {
              this.props.handleShapesChange(updatedShapes);
            }
          }
          this.setSmooth(null);
        } else {
          // start
          this.setSmooth(path);
        }
      }
    }
  }

  setSmooth(smooth: paper.Path | null) {
    if (this.smoothPath) {
      this.smoothPath.fullySelected = false;
      this.smoothPath.segments.forEach((seg) => {
        seg.clearHandles();
      });
    }
    this.smoothPath = smooth;
    if (this.smoothPath) {
      this.smoothPath.smooth({ type: 'continuous' });
      this.smoothPath.fullySelected = true;
    }
  }

  setSelectedCurves() {
    if (this.props.selectedShapeInfo) {
      const { selectedShapeInfo } = this.props;
      const { instanceId, groupName, pointCategory } = selectedShapeInfo as PointInfo;
      const path = this.getPathByCategory(instanceId, groupName, pointCategory);
      this.toggleCurves(path);
    }
    const { instanceId, groupName, id } = this.props.selectedShapeStatus;
    if (typeof id === 'number') {
      const point = this.getShapeByKey(instanceId, groupName, id);
      if (point) {
        const { data: { lines = [] } } = point;
        lines.forEach(({ pathId }: any) => {
          const path = this.getPathById(instanceId, groupName, pathId);
          this.toggleCurves(path);
        });
      }
    }
  }

  toggleCurves(path?: paper.Path) {
    if (rootStore.setting.pathStyle === PathStyles.CURVES && path) {
      const { data: { instanceId, groupName, id: pathId, points }, segments } = path;
      const { currentFrame } = this.props;
      path.smooth({ type: 'continuous' });
      const map: {[pointIndex: number]: Handle} = {};
      // points
      (points as number[]).forEach((pointIndex, i) => {
        const segment = segments[i];
        if (segment) {
          const { handleIn, handleOut, point } = segment;
          map[pointIndex] = {
            frameIndex: currentFrame,
            pathId,
            instanceId,
            groupName,
            pointIndex,
            handleIn: { x: handleIn.x, y: handleIn.y },
            handleOut: { x: handleOut.x, y: handleOut.y },
            pointPosition: { x: point.x, y: point.y },
          };
        }
      });
      rootStore.handle.setPathHandles(currentFrame, pathId, map);
    }
  }

  setCategoryAsCircle() {
    if (this.props.selectedShapeInfo) {
      const { instanceId, category, groupName, pointCategory } = this.props.selectedShapeInfo as PointInfo;
      if (pointCategory) {
        const container: Group = { instanceId, category, groupName };
        const categoryKey = `${this.props.currentFrame}_${instanceId}_${groupName}_${pointCategory}`;
        if (this.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE) {
          this.updateCirclePath(pointCategory, false, container);
          this.props.setCategoryPathShape(categoryKey);
        } else {
          const updatedShapes = this.updateCirclePath(pointCategory, true, container);
          this.props.setCategoryPathShape(categoryKey, CategoryPathShape.CIRCLE, updatedShapes);
        }
      }
    }
  }

  updateCirclePath(categoryName: string, isCirclePath = true, container: Group) {
    const { instanceId, groupName, category } = container;
    const updatedShapes: UpdatedShape[] = [];
    const path = this.getPathByCategory(instanceId, groupName, categoryName);
    const categoryData = rootStore.ontology.getCategoryData(category, groupName, categoryName);
    const lineColor = categoryData?.isConnect === false ?
      new Paper.Color('rgba(0,0,0,0)') :
      new Paper.Color(categoryData?.displayColor || POINT_COLOR);
    if (path && categoryData) {
      const categoryPoints = this.getPointsByCategory(instanceId, groupName, categoryName);
      if (categoryPoints) {
        const sortedKeys = [...categoryData.keys].sort((a, b) => a - b);
        const pIndex1 = sortedKeys[0];
        const pIndex2 = sortedKeys[Math.ceil(sortedKeys.length / 2)];
        const point1 = categoryPoints.find((p) => p.data.index === pIndex1);
        const point2 = categoryPoints.find((p) => p.data.index === pIndex2);
        const zoom = Paper.view.zoom * this.mainLayer!.matrix.scaling.x;
        if (point1 && point2) {
          if (isCirclePath) {
            // is a circle & key points all exist
            const centerX = (point1.position.x + point2.position.x) / 2;
            const centerY = (point1.position.y + point2.position.y) / 2;
            const radius = Math.sqrt((point2.position.x - point1.position.x) ** 2 + (point2.position.y - point1.position.y) ** 2) / 2;
            const newPath = new Paper.CompoundPath({
              children: [
                new Paper.Path.Circle({
                  center: [centerX, centerY],
                  radius,
                }),
                new Paper.Path.Line({
                  from: [point1.position.x, point1.position.y],
                  to: [point2.position.x, point2.position.y],
                }),
                new Paper.Path.Line({
                  from: new Paper.Point(computeRotatedPosition({ x: centerX, y: centerY }, point1.position, Math.PI / 2)),
                  to: new Paper.Point(computeRotatedPosition({ x: centerX, y: centerY }, point1.position, -Math.PI / 2)),
                }),
              ],
              strokeWidth: rootStore.setting.lineWidth / zoom,
              strokeColor: lineColor,
              selectedColor: lineColor,
            });
            newPath.data = { ...path.data, isCircle: true, instanceId, groupName };
            path.replaceWith(newPath);

            // update all points in this pointCategory
            const update = (index: number, position: { x: number; y: number }) => {
              const existingPoint = this.getShapeByKey(instanceId, groupName, index) as paper.Shape;
              const pointInfo = {
                frameIndex: this.props.selectedShapeStatus.frameIndex,
                instanceId,
                category,
                groupName,
                index,
                shapeType: LandmarkEditType.KEYPOINT,
              };
              if (existingPoint) {
                // update position
                existingPoint.position.x = position.x;
                existingPoint.position.y = position.y;
                this.updatePath(existingPoint, position);
                updatedShapes.push({
                  ...pointInfo,
                  shape: {
                    position: { x: position.x, y: position.y }
                  },
                });
              } else {
                const isKeyPoint = categoryData.keys.includes(index);
                const groupContainer = this.getGroupContainerByGroupName(instanceId, groupName);

                this.addKeypointShape(new Paper.Point(position.x, position.y), categoryData.name, index, isKeyPoint, groupContainer, true);
                updatedShapes.push({
                  ...pointInfo,
                  shape: {
                    pointCategory: categoryData.name,
                    isKeyPoint,
                    position: { x: position.x, y: position.y },
                    visible: true,
                  },
                });
              }
            };
            const [start, end] = categoryData.range;
            for (let i = pIndex1 + 1; i < pIndex2; i += 1) {
              const radians = (Math.PI / (pIndex2 - pIndex1)) * (i - pIndex1);
              const position = computeRotatedPosition({ x: centerX, y: centerY }, point1.position, radians);
              update(i, position);
            }
            for (let i = pIndex2 + 1; i <= end; i += 1) {
              const radians = (Math.PI / (end + 1 - pIndex2)) * (i - pIndex2);
              const position = computeRotatedPosition({ x: centerX, y: centerY }, point2.position, radians);
              update(i, position);
            }
            for (let i = start; i < pIndex1; i += 1) {
              const radians = (Math.PI / (end + 1 - pIndex2)) * (start - pIndex1);
              const position = computeRotatedPosition({ x: centerX, y: centerY }, point1.position, radians);
              update(i, position);
            }
          } else {
            const points = [...categoryPoints].sort((a, b) => a.data.index - b.data.index);
            const newPath = new Paper.Path({
              segments: points.map((p) => p.position),
              strokeWidth: rootStore.setting.lineWidth / zoom,
              strokeColor: lineColor,
              selectedColor: lineColor,
            });
            newPath.data = { ...path.data, isCircle: false, points: points.map((p) => p.data.index) };
            path.replaceWith(newPath);
            this.toggleCurves(newPath);
          }
        }
      }
    }
    return updatedShapes;
  }

  updateGroupBox = (instanceId: string, category: string, groupName: string) => {
    let boundRect = this.getShapeByGroup();
    const { selectedShapeStatus } = this.props;
    let isRemovebound = false;
    if (
      instanceId &&
      instanceId === selectedShapeStatus.instanceId &&
      groupName === selectedShapeStatus.groupName
    ) {
      const { ontology, setting: { pointSize, lineWidth, labelItems } } = rootStore;
      const groupConntainer = this.getGroupContainerByGroupName(instanceId, groupName);
      const points = groupConntainer && groupConntainer.children
        .filter((v: any) => v.type === CategoryPathShape.CIRCLE)
        .map((v) => [v.position.x, v.position.y]);
      if (points && points.length > 0) {
        const xList = points.map((v) => v[0]);
        const yList = points.map((v) => v[1]);
        const minX = Math.min(...xList);
        const maxX = Math.max(...xList);
        const minY = Math.min(...yList);
        const maxY = Math.max(...yList);
        if (this.mainLayer) {
          const zoom = Paper.view.zoom * this.mainLayer.matrix.scaling.x;
          if (boundRect) {
            boundRect.remove();
          }
          const range = (pointSize * 3) / zoom;
          const fontSize = FONT_SIZE / this.paperZoom;
          const strokeWitdth = lineWidth / zoom;
          boundRect = new Paper.Shape.Rectangle({
            point: [minX - range, minY - range],
            size: [maxX - minX + 2 * range, maxY - minY + 2 * range],
            strokeColor: new Paper.Color('#FFE600'),
            strokeWidth: strokeWitdth
          });
          boundRect.data.type = SHAPE_TYPE.KEYPOINT_BOX;
          this.mainLayer.addChild(boundRect);
          const groupInfo = ontology.getGroupData(category, groupName);
          const instance = this.props.getInstance(instanceId);
          const group = instance?.children.find((g) => g.name === groupName)?.frames[this.props.currentFrame];
          const attrsLabel = getValuesLabel(groupInfo?.label_config?.fields, group?.attributes, labelItems);
          const content = `${groupInfo?.class_display_name || ''} ${instance?.number || ''}-${groupInfo?.display_name || groupInfo?.name || ''}`;
          const labelGroup = this.getLabelByKey('', '', 'group_label');
          const groupAttribute = this.getLabelByKey('', '', 'group_attributes');
          labelGroup?.remove();
          groupAttribute?.remove();
          const x = minX - range; const y = minY - range - strokeWitdth * 2;
          const w = maxX - minX + 2 * range; const h = maxY - minY + 2 * range;
          this.addLabel(
            content,
            { x, y, width: w, height: h },
            { instanceId: '', category: '', groupName: '' },
            'group_label',
            true,
            SHAPE_TYPE.KEYPOINT_BOX
          );
          this.addLabel(
            attrsLabel,
            { x, y: y - fontSize * 1.5, width: w, height: h },
            { instanceId: '', category: '', groupName: '' },
            'group_attributes',
            true,
            SHAPE_TYPE.KEYPOINT_BOX
          );
        }
      } else {
        isRemovebound = true;
      }
    } else {
      isRemovebound = true;
    }
    if (isRemovebound && boundRect) {
      boundRect.remove();
      this.removeLabel('', '', 'group_label');
      this.removeLabel('', '', 'group_attributes');
    }
  };

  addRectangle(path: paper.Path, groupInfo: GroupInfo, add = true) {
    if (this.mainLayer) {
      const { displayColor, instanceId, category, groupName } = groupInfo;
      const { data: { id }, segments } = path;
      const rectData = {
        x: segments[0].point.x,
        y: segments[0].point.y,
        width: segments[2].point.x - segments[0].point.x,
        height: segments[2].point.y - segments[0].point.y,
        displayColor,
      };
      this.drawRectangle(rectData, { instanceId, category, groupName }, id);
      if (add) {
        this.props.setNextEmptyShape();
      }
    }
  }

  getAlphaColor(color: string, opacity = this.fillOpacity) {
    return hexToRgba(color, opacity);
  }

  drawRectangle(
    rectData: {x: number, y: number, width: number, height: number, displayColor?: string},
    groupData: Group,
    id: string,
    visible = true
  ) {
    if (this.props.selectedShapeInfo && this.mainLayer) {
      const { x, y, width, height, displayColor } = rectData;
      const { instanceId, category, groupName } = groupData;
      let instanceContainer = this.getInstanceContainerByInstaceId(instanceId);
      let groupContainer = this.getGroupContainerByGroupName(instanceId, groupName);
      if (!instanceContainer) {
        instanceContainer = new Paper.Group();
        instanceContainer.data = {
          instanceId,
          name: category,
          type: SHAPE_TYPE.INSTANCE,
        };
        this.mainLayer?.addChild(instanceContainer);
      }
      if (!instanceContainer || !groupContainer) {
        groupContainer = new Paper.Group();
        groupContainer.data = {
          groupName,
          category,
          type: SHAPE_TYPE.GROUP,
          instanceId,
        };
        instanceContainer.addChild(groupContainer);
      }
      const zoom = Paper.view.zoom * this.mainLayer.matrix.scaling.x;
      let rectangleBox = this.getShapeByKey(instanceId, groupName, id);
      if (rectangleBox) {
        rectangleBox.removeChildren();
      } else {
        rectangleBox = new Paper.Group();
        rectangleBox.data = {
          frameIndex: this.props.selectedShapeStatus.frameIndex,
          id,
          groupName,
          category,
          type: SHAPE_TYPE.RECTANGLE_GROUP,
          instanceId,
          displayColor,
          visible,
        };
        groupContainer.addChild(rectangleBox);
      }
      const rectangle = new Paper.Shape.Rectangle({
        point: [x, y],
        size: [width, height],
        fillColor: this.getAlphaColor(displayColor || POINT_COLOR),
        strokeWidth: rootStore.setting.lineWidth / zoom
      });
      rectangle.data = {
        parentShape: id,
        cursor: Cursor.MOVE,
        type: SHAPE_TYPE.RECTANGLE
      };
      rectangleBox.addChild(rectangle);
      this.selectShape(instanceId, groupName, id, id === this.props.selectedShapeStatus.id);
      if (this.labelLayer) {
        const groupInfo = rootStore.ontology.getGroupData(category, groupName);
        const instance = this.props.getInstance(instanceId);
        const group = instance?.children.find((g) => g.name === groupName)?.frames[this.props.currentFrame];
        const label = `${groupInfo?.class_display_name || ''} ${instance?.number || ''}-${groupInfo?.display_name || groupInfo?.name || ''}`;
        let attrsLabel = getValuesLabel(groupInfo?.label_config?.fields, group?.attributes, rootStore.setting.labelItems);
        attrsLabel = `${rootStore.setting.displayCategory ? `${label};` : ''}${rootStore.setting.displayCategory && attrsLabel ? ';' : ''}${attrsLabel}`;
        const labelGroup = this.getLabelByKey(instanceId, groupName, id);
        if (labelGroup) {
          this.updateLabel(
            instanceId,
            groupName,
            id,
            { x, y },
            { x: x + width / 2, y: y + height / 2 },
          );
        } else {
          this.addLabel(
            label,
            { x, y, width, height },
            { instanceId, category, groupName },
            id,
            visible,
            SHAPE_TYPE.RECTANGLE,
            attrsLabel
          );
        }
      }
    }
  }

  removeRectangle(instanceId: string, groupName: string, id: string) {
    const rectangleBox = this.getShapeByKey(instanceId, groupName, id);
    if (rectangleBox) {
      rectangleBox.removeChildren();
      rectangleBox.remove();
      this.removeLabel(instanceId, groupName, id);
    }
  }

  selectShape(instanceId: string, groupName: string, id: string, selected = true) {
    if (this.mainLayer) {
      const rectangleBox = this.getShapeByKey(instanceId, groupName, id);
      if (rectangleBox && rectangleBox.children) {
        const { bounds: { topLeft, topRight, bottomRight, bottomLeft, x, y, height, width } } = rectangleBox.children[0];
        const points = [topLeft, topRight, bottomRight, bottomLeft];
        const { displayColor } = rectangleBox.data;
        const zoom = Paper.view.zoom * this.mainLayer.matrix.scaling.x;
        if (selected) {
          const radius = (rootStore.setting.pointSize / 2) / zoom;
          const newColor = new Paper.Color(displayColor || POINT_COLOR);
          points.forEach((point, index) => {
            const sourceSeg = new Paper.Segment(point);
            const targetSeg = index + 1 >= points.length ?
              new Paper.Segment(points[0]) :
              new Paper.Segment(points[index + 1]);

            const lineBar = new Paper.Path({
              segments: [sourceSeg, targetSeg],
              strokeWidth: rootStore.setting.lineWidth / zoom,
              fillColor: newColor,
              strokeColor: newColor,
              selectedColor: newColor,
            });
            lineBar.data = {
              parentShape: id,
              cursor: index % 2 === 0 ? Cursor.NS_RESIZE : Cursor.EW_RESIZE,
              type: SHAPE_TYPE.RECTANGLE_PATH,
              controlIndex: index,
            };
            rectangleBox.addChild(lineBar);
          });
          points.forEach((point, index) => {
            const control = new Paper.Shape.Circle(point, radius);
            control.strokeColor = newColor;
            control.strokeWidth = rootStore.setting.lineWidth / zoom;
            control.fillColor = newColor;
            control.data = {
              parentShape: id,
              cursor: index % 2 === 0 ? Cursor.NWSE_RESIZE : Cursor.NESW_RESIZE,
              type: SHAPE_TYPE.RECTANGLE_POINT,
              controlIndex: index,
              displayColor
            };
            rectangleBox.addChild(control);
          });
        } else {
          rectangleBox.removeChildren();
          const rectangle = new Paper.Shape.Rectangle({
            point: [x, y],
            size: [width, height],
            fillColor: this.getAlphaColor(displayColor || POINT_COLOR),
            strokeWidth: rootStore.setting.lineWidth / zoom
          });
          rectangle.data = {
            parentShape: id,
            cursor: Cursor.MOVE,
            type: SHAPE_TYPE.RECTANGLE
          };
          rectangleBox.addChild(rectangle);
        }
      }
    }
  }

  drawWarnings() {
    this.warningLayer?.removeChildren();
    const { qaWarnings: warnings } = rootStore.review;
    if (warnings.length > 0) {
      this.currentWarnings = warnings.filter((warning) => warning.frames[0] === this.props.currentFrame);
      if (this.warningLayer) {
        const strokeWitdth = 2 / this.paperZoom;
        const warningIconSize = 8 / this.paperZoom;
        this.currentWarnings.forEach((warning) => {
          const { id, groupName, shapeIds, data } = warning;
          if (!groupName || !shapeIds) {
            // missing
            if (data?.position) {
              const warningIcon = new Paper.Shape.Circle({
                center: data.position,
                radius: warningIconSize,
                fillColor: '#DD4924',
              });
              const text = new Paper.PointText({
                content: '!',
                fontSize: FONT_SIZE / this.paperZoom,
                fontWeight: '700',
                fillColor: 'white',
              });
              warningIcon.data = { id };
              text.data = { id };
              text.position.set(data.position);
              const group = new Paper.Group();
              group.addChild(warningIcon);
              group.addChild(text);
              this.warningLayer!.addChild(group);
            }
            return;
          }
          const shapes: paper.Item[] = [];
          shapeIds!.forEach((shapeId) => {
            const shape = this.getShapeByKey(id, groupName!, shapeId);
            if (shape) {
              shapes.push(shape);
              if (shape.data.type !== SHAPE_TYPE.RECTANGLE_GROUP) {
                const { x, y, width, height } = shape.bounds;
                const boundRect = new Paper.Shape.Rectangle({
                  point: [x - strokeWitdth, y - strokeWitdth],
                  size: [width + 2 * strokeWitdth, height + 2 * strokeWitdth],
                  strokeColor: new Paper.Color('#DC4624'),
                  strokeWidth: strokeWitdth
                });
                this.warningLayer!.addChild(boundRect);
              }
            }
          });
          let position: number[] = [];
          if (shapes.length > 1) {
            const minXList: number[] = [];
            const maxXList: number[] = [];
            const minYList: number[] = [];
            const maxYList: number[] = [];
            shapes.forEach(({ bounds: { x, y, width, height } }) => {
              minXList.push(x - strokeWitdth);
              maxXList.push(x + width + strokeWitdth);
              minYList.push(y - strokeWitdth);
              maxYList.push(y + height + strokeWitdth);
            });
            const minX = Math.min(...minXList);
            const maxX = Math.max(...maxXList);
            const minY = Math.min(...minYList);
            const maxY = Math.max(...maxYList);
            const boundRect = new Paper.Shape.Rectangle({
              point: [minX - 2 * strokeWitdth, minY - 2 * strokeWitdth],
              size: [maxX - minX + 4 * strokeWitdth, maxY - minY + 4 * strokeWitdth],
              strokeColor: new Paper.Color('#DC4624'),
              strokeWidth: strokeWitdth
            });
            this.warningLayer!.addChild(boundRect);
            position = [minX - warningIconSize, minY - warningIconSize];
          } else if (shapes.length === 1) {
            position = [shapes[0].bounds.x - warningIconSize, shapes[0].bounds.y - warningIconSize];
          }
          if (shapes.length > 0) {
            const warningIcon = new Paper.Shape.Circle({
              center: new Paper.Point(position[0], position[1]),
              radius: warningIconSize,
              fillColor: '#DC4624',
            });
            const text = new Paper.PointText({
              content: '!',
              fontSize: FONT_SIZE / this.paperZoom,
              fontWeight: '700',
              fillColor: 'white',
            });
            warningIcon.data = { instanceId: id, groupName, shapeIds };
            text.data = { instanceId: id, groupName, shapeIds };
            text.position.x = position[0];
            text.position.y = position[1];
            this.warningLayer!.addChild(warningIcon);
            this.warningLayer!.addChild(text);
          }
        });
      }
    }
  }

  render() {
    return (
      <div
        ref={this.canvasContainer}
        className="canvas"
        style={{ cursor: this.cursor }}
      >
        <canvas ref={this.canvas} />
        {this.props.isReview && (
          <div className="layer">
            <div className="tip">
              <span>{formatMessage('ORIGINAL_DATA')}</span>
              <span>{formatMessage('REVIEW_TIP')}</span>
              <Button className="close" onClick={this.props.setReview} size="small">
                {formatMessage('REVIEW_CLOSE', { values: { shortcut: 'Ctrl+V' } })}
              </Button>
            </div>
          </div>
        )}
        {(this.props.loading) && (
          <div className="loading">
            {!this.raster && <Spin indicator={<LoadingOutlined style={{ fontSize: 100, color: '#00bad3' }} spin />} />}
          </div>
        )}
      </div>
    );
  }
}

export default Canvas;
