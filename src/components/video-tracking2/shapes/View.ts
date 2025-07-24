import { Container, Sprite, Texture, Graphics, Point, Rectangle, DisplayObject, InteractionEvent } from 'pixi.js';
import { v4 as uuidv4 } from 'uuid';
import ShapeGraphics from '../../common/shapes/ShapeGraphics';
import Shape from '../../common/shapes/Shape';
import Layer from '../../common/shapes/Layer';
import { hitTesting } from '../../common/shapes/utils';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 100;

export enum EventAction {
  SELECTED = 'selected',
  POINTERDOWN = 'pointer-down',
  SCALE_CHANGED = 'scale-changed',
  POSITION_CHANGED = 'position-changed',
}

interface ViewOptions {
  id?: string;
  enableReview?: boolean;
  enableSnap?: boolean;
}

class View extends Container {
  /**
   * view id
   */
  id: string;

  /**
   * view stage (similar with PIXI stage)
   */
  stage = new Container();

  /**
   * shapes layer
   */
  shapesLayer = new Layer();

  /**
   * review layer (for review anchors)
   */
  reviewLayer?: Container;

  /**
   * image sprite instance
   */
  image = new Sprite(Texture.EMPTY);

  /**
   * image load error
   */
  imageLoadError = false;

  /**
   * first imge loaded
   */
  firstLoaded = false;

  /**
   * view width (default 400)
   */
  viewWidth = 400;

  /**
   * view height (default 300)
   */
  viewHeight = 300;

  /**
   * zoom level, default is 1 when image fits the view
   */
  viewZoom = 1;

  /**
   * get scale of view
   * @getter
   */
  get viewScale() {
    return this.stage.scale.x;
  }

  /**
   * set scale of view
   * @setter
   */
  set viewScale(scale: number) {
    this.stage.scale.set(scale);
    // update shapes scale
    const setChildrenScale = (children: DisplayObject[]) => {
      children.forEach((child) => {
        if (child instanceof ShapeGraphics) {
          // eslint-disable-next-line no-param-reassign
          child.shape.scale = scale;
        } else if (child instanceof Container) {
          setChildrenScale(child.children);
        }
      });
    };
    setChildrenScale(this.shapesLayer.children);

    this.emit(EventAction.SCALE_CHANGED, scale, this);
  }

  /**
   * is right button clicked
   * @private
   */
  private _rightClicked = false;

  /**
   * click position when right button clicked
   * @private
   */
  private _rightClickPoint: Point | null = null;

  /**
   * stage position when right button clicked
   * @private
   */
  private _rightClickPosition: Point | null = null;

  /**
   * is view selected
   */
  selected = false;

  /**
   * view selected changed
   */
  private _selectedChanged = false;

  /**
   * is view hovered
   */
  hovered = false;

  /**
   * hovered shape
   */
  hoveredShape?: Shape<unknown>;

  /**
   * auto snape enabled
   * @private
   */
  private _autoSnapEnabled = true;

  constructor({ id, enableReview, enableSnap = true }: ViewOptions) {
    super();
    this.id = id || uuidv4();

    this.interactive = true;
    this.on('pointerover', () => {
      this.hovered = true;
    });
    this.on('pointerout', () => {
      this.hovered = false;
    });
    this.on('pointerdown', this.processPointerDown);
    this.on('pointermove', this.processPointerMove);
    this.on('pointerup', this.processPointerUp);
    this.on('pointerupoutside', this.processPointerUp);
    this.on('pointerout', this.processPointerOut);

    this.shapesLayer.sortableChildren = true;
    this.stage.addChild(this.shapesLayer);
    if (enableReview) {
      this.reviewLayer = new Container();
      this.stage.addChild(this.reviewLayer);
    }

    this.stage.addChildAt(this.image, 0);
    this.addChild(this.stage);

    this._autoSnapEnabled = enableSnap;
  }

  /**
   * process pointer down
   * @param e
   */
  processPointerDown = (e: InteractionEvent) => {
    const selected = this.selected;
    this.emit(EventAction.SELECTED, e.data.originalEvent, this);
    this._selectedChanged = this.selected !== selected;

    if (this.imageLoadError) {
      return;
    }

    if (e.data.button === 2) {
      const point = e.data.getLocalPosition(this);
      this._rightClicked = true;
      this._rightClickPoint = point;
      this._rightClickPosition = this.stage.position.clone();
      return;
    }

    const localPoint = e.data.getLocalPosition(this.stage);
    if (this._selectedChanged && this.hovered) {
      // if selected changed, should get cursor hovered shape
      this.hitTest(e.data.global, localPoint, e.data.originalEvent.ctrlKey);
      if (this.hoveredShape) {
        // if hovered, mock pointer down event for the shape
        this.hoveredShape.processPointerDown(e);
      }
    }
    this.emit(EventAction.POINTERDOWN, localPoint, e.data.originalEvent, this);
  };

  /**
   * process pointer move
   * @param e
   */
  processPointerMove = (e: InteractionEvent) => {
    if (this.imageLoadError || !this.selected) {
      return;
    }

    if (this._rightClicked && this._rightClickPoint && this._rightClickPosition) {
      const point = e.data.getLocalPosition(this);
      const offsetX = point.x - this._rightClickPoint.x;
      const offsetY = point.y - this._rightClickPoint.y;
      const x = this._rightClickPosition.x + offsetX;
      const y = this._rightClickPosition.y + offsetY;
      this.setStagePosition(x, y);
      return;
    }

    if (this._selectedChanged && this.hoveredShape) {
      // not continue, current is moving shape
      return;
    }

    const localPoint = e.data.getLocalPosition(this.stage);

    if (this.hovered) {
      this.hitTest(e.data.global, localPoint, e.data.originalEvent.ctrlKey);
    }
  };

  /**
   * process pointer up
   */
  processPointerUp = () => {
    this._rightClicked = false;
    this._rightClickPoint = null;
    this._rightClickPosition = null;
    this._selectedChanged = false;
  };

  /**
   * process pointer out
   */
  processPointerOut = () => {
    this.processPointerUp();
    this.setHoveredShape();
  };

  /**
   * update position and size
   * @param x
   * @param y
   * @param width
   * @param height
   */
  updatePositionAndSize(x: number, y: number, width: number, height: number) {
    const positionUpdated = this.x !== x || this.y !== y;
    const sizeUpdated = this.viewWidth !== width || this.viewHeight !== height;
    this.x = x;
    this.y = y;
    this.viewWidth = width;
    this.viewHeight = height;
    this.hitArea = new Rectangle(0, 0, width, height);
    if (positionUpdated || sizeUpdated) {
      this.mask = new Graphics()
        .beginFill(0x000000)
        .drawRect(x, y, width, height)
        .endFill();
    }
  }

  /**
   * get stage position
   */
  getStagePosition() {
    return {
      x: this.stage.x,
      y: this.stage.y,
    };
  }

  /**
   * set stage posistion
   * @param x
   * @param y
   */
  setStagePosition(x: number, y: number) {
    this.stage.x = x;
    this.stage.y = y;
    this.emit(EventAction.POSITION_CHANGED, { x, y }, this);
  }

  /**
   * set image
   * @param texture
   */
  setImage(texture: Texture) {
    // this.image.cacheAsBitmap = false;
    if (this.image.texture) {
      this.image.texture.destroy(true);
    }
    this.image.texture = texture;
    // this.image.cacheAsBitmap = true;
    this.rotate();
    if (!this.firstLoaded) {
      this.firstLoaded = true;
      this.fitImageToView();
    }
  }

  /**
   * set hovered shape
   * @param shape
   */
  setHoveredShape(shape?: Shape<unknown>) {
    if (shape === this.hoveredShape) {
      return;
    }
    if (this.hoveredShape && !this.hoveredShape.destroyed) {
      this.hoveredShape.hovered = false;
    }
    this.hoveredShape = shape;
    if (this.hoveredShape) {
      this.hoveredShape.hovered = true;
    }
  }

  /**
   * hit test
   * @param point
   * @param localPoint
   * @param ctrlKey
   */
  hitTest(point: Point, localPoint: Point, ctrlKey = false) {
    if (ctrlKey) {
      this.setHoveredShape();
      this.shapesLayer.setSnappingPoint(null);
      return;
    }
    const { intersection, snappingPoint } = hitTesting(point, localPoint, this.shapesLayer.children);
    this.setHoveredShape(intersection);
    this.shapesLayer.setSnappingPoint(this._autoSnapEnabled ? snappingPoint : null);
  }

  /**
   * rotate
   */
  rotate = () => {
    if (this.image && !this.imageLoadError) {
      // set pivot
      const { width, height } = this.image;
      this.image.pivot.set(width / 2, height / 2);

      // set position
      const px = width / 2;
      const py = height / 2;
      const { x: ox, y: oy } = this.image.position;
      this.image.position.set(px, py);
      const offsetX = px - ox;
      const offsetY = py - oy;

      // update stage position
      const { x, y } = this.getStagePosition();
      this.setStagePosition(x - offsetX * this.viewScale, y - offsetY * this.viewScale);
    }
  };

  /**
   * zoom
   * @param event
   * @param zoomPoint
   */
  zoom = (event: WheelEvent, zoomPoint: Point, step = 0.1) => {
    if (this.imageLoadError || !this.selected || !this.hovered) {
      return false;
    }
    event.stopPropagation();
    const zoomPointX = zoomPoint.x - this.position.x;
    const zoomPointY = zoomPoint.y - this.position.y;
    let newZoom = event.deltaY > 0 ? this.viewZoom / (1 + step) : this.viewZoom * (1 + step);
    newZoom = Math.max(Math.min(newZoom, ZOOM_MAX), ZOOM_MIN);
    const zoomScale = newZoom / this.viewZoom;
    const { x, y } = this.getStagePosition();
    this.setStagePosition(zoomPointX - (zoomPointX - x) * zoomScale, zoomPointY - (zoomPointY - y) * zoomScale);
    this.viewZoom = newZoom;
    this.viewScale *= zoomScale;
    return true;
  };

  /**
   * zoom to provided scale
   * @param scale
   */
  zoomTo = (scale: number) => {
    if (this.imageLoadError) {
      return;
    }
    const centerX = this.viewWidth / 2;
    const centerY = this.viewHeight / 2;
    let newZoom = this.viewZoom * (scale / this.viewScale);
    newZoom = Math.max(Math.min(newZoom, ZOOM_MAX), ZOOM_MIN);
    const zoomScale = newZoom / this.viewZoom;
    const { x, y } = this.getStagePosition();
    this.setStagePosition(centerX - (centerX - x) * zoomScale, centerY - (centerY - y) * zoomScale);
    this.viewZoom = newZoom;
    this.viewScale *= zoomScale;
  };

  /**
   * fit image to canvas
   */
  fitImageToView = () => {
    if (this.imageLoadError) {
      return;
    }
    const { width, height } = this.image;
    const imageWidth = width;
    const imageHeight = height;
    const viewRatio = this.viewWidth / this.viewHeight;
    const imgRatio = imageWidth / imageHeight;
    const scale = (viewRatio < imgRatio ? this.viewWidth / imageWidth : this.viewHeight / imageHeight) * 0.98;
    this.setStagePosition((this.viewWidth - scale * imageWidth) / 2, (this.viewHeight - scale * imageHeight) / 2);
    this.viewScale = scale;
    this.viewZoom = 1;
  };

  /**
   * fit shape to canvas
   * @param bbox
   * @param percentage
   */
  fitShapeToView = (bbox: { left: number; top: number; right: number; bottom: number }, percentage = 0.98) => {
    if (this.imageLoadError) {
      return;
    }
    const { left, top, right, bottom } = bbox;
    const width = right - left;
    const height = bottom - top;
    if (width !== 0 && height !== 0) {
      const oldViewScale = this.viewScale;
      const viewRatio = this.viewWidth / this.viewHeight;
      const ratio = width / height;
      let scale = (viewRatio < ratio ? this.viewWidth / width : this.viewHeight / height) * percentage;
      let zoomScale = scale / oldViewScale;
      let zoomLevel = Math.max(Math.min(this.viewZoom * zoomScale, ZOOM_MAX), ZOOM_MIN);
      if (zoomLevel < 1) {
        zoomLevel = 1;
        zoomScale = zoomLevel / this.viewZoom;
        scale = zoomScale * oldViewScale;
      }
      this.setStagePosition(this.viewWidth / 2 - scale * (left + width / 2), this.viewHeight / 2 - scale * (top + height / 2));
      this.viewScale = scale;
      this.viewZoom *= zoomScale;
    }
  };
}

export default View;
