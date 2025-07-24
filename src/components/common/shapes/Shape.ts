import { v4 as uuidv4 } from 'uuid';
import { Application, Container, Graphics, InteractionEvent, Point, Text, utils as PIXIUtils } from 'pixi.js';
import { Geom } from 'polygon-clipping';
import Layer from './Layer';
import ExtendedGraphics from './ExtendedGraphics';
import ShapeGraphics from './ShapeGraphics';
import { ShapeType, ShapeData } from './types';
import Control from './controls/Control';
import ControlRotation from './controls/ControlRotation';
import Label from './label/Label';
import { findIntersections } from './utils';
import Cursor from '../Cursor';
import { computeRotatedPosition } from '../../../utils/math';

export enum EventAction {
  SELECTED = 'selected',
  VERTEX_SELECTED = 'vertex-selected',
  FINISHED = 'finished',
  REMOVED = 'removed',
  CHANGED = 'changed',
  POINTER_OVER = 'pointer-over',
  POINTER_OUT = 'pointer-out',
}

export enum BorderStyle {
  SOLID = 'solid',
  DASHED = 'dashed',
}

export interface ShapeOptions {
  app: Application;
  container?: Container;
  scale?: number;
  color?: number; // default for vertexes, edges & fill
  alpha?: number;
  label?: string;
  showVertex?: boolean;
  showVertexOrder?: boolean;
  rotatable?: boolean;
  labelDom?: Label;
}

/**
 * Shape base
 * @class
 */
export default abstract class Shape<T> {
  /**
   * shape type
   */
  abstract shapeType: ShapeType;

  /**
   * unique id
   * @member {string}
   */
  uid = uuidv4();

  /**
   * PIXI instance
   * @member {ShapeGraphics}
   */
  instance = new ShapeGraphics<T>(this);

  /**
   * PIXI application
   * @member {PIXI.Application}
   */
  app: Application;

  /**
   * PIXI container
   * @member {PIXI.Container | Layer}
   */
  container: Container | Layer;

  /**
   * origin colors from shape options
   */
  originColors: {
    color: number;
    borderColor: number;
  } = {
    color: 0,
    borderColor: 0,
  };

  /**
   * selected border color
   * @member {number}
   */
  selectedColor = 0xFFFF00;

  /**
   * hovered border color
   * @member {number}
   */
  hoveredColor = 0xCCCCCC;

  /**
   * shape container
   * @member {PIXI.Container}
   */
  shapeContainer = new Container();

  /**
   * controls container
   * @member {PIXI.Container}
   */
  controlsContainer = new Container();

  /**
   * label container
   * @member {PIXI.Container}
   */
  labelContainer?: Container;

  /**
   * label dom
   * @member {Label}
   */
  labelDom?: Label;

  /**
   * container to show shape vertexes
   * @member {PIXI.Container}
   */
  vertexesContainer?: Container;

  /**
   * is shape destroyed
   * @member {boolean}
   */
  destroyed = false;

  /**
   * is shape resizing
   * @member {boolean}
   */
  resizing = false;

  /**
   * is shape dragging
   * @member {boolean}
   */
  dragging = false;

  /**
   * events emitter
   * @private {PIXI.utils.EventEmitter}
   */
  private _eventEmitter = new PIXIUtils.EventEmitter();

  /**
   * controls
   * @protected {Control[]}
   */
  protected _controls: Control[] = [];

  /**
   * control for shape rotation
   * @protected {ControlRotation}
   */
  protected _rotateControl?: ControlRotation;

  /**
   * instance to draw shape boundary control
   * @protected {ExtendedGraphics}
   */
  protected _controlLine = new ExtendedGraphics();

  /**
   * color
   * @protected {number}
   */
  protected _color = 0;

  /**
   * border color
   * @protected {number}
   */
  protected _borderColor = 0;

  /**
   * shape alpha
   * @protected {number}
   */
  protected _alpha = 0.5;

  /**
   * shape label
   * @protected {string}
   */
  protected _label = '';

  /**
   * shape border style
   * @protected {BorderStyle}
   */
  protected _borderStyle = BorderStyle.SOLID;

  /**
   * show shape vertex
   * @protected {boolean}
   */
  protected _showVertex = false;

  /**
   * show shape vertex order
   * @protected {boolean}
   */
  protected _showVertexOrder = false;

  /**
   * shape z-index
   * @protected {number}
   */
  protected _order = 0;

  /**
   * is shape visible
   * @protected {boolean}
   */
  protected _visible = true;

  /**
   * is shape interactive
   * @protected {boolean}
   */
  protected _interactive = true;

  /**
   * is shape editable
   * @protected {boolean}
   */
  protected _editable = true;

  /**
   * is shape rotatable
   * @protected {boolean}
   */
  protected _rotatable = false;

  /**
   * is shape drawing finished
   * @protected {boolean}
   */
  protected _finished = true;

  /**
   * is shape selected
   * @protected {boolean}
   */
  protected _selected = false;

  /**
   * is shape hovered
   * @protected {boolean}
   */
  protected _hovered = false;

  /**
   * shape scale factor
   * @protected {boolean}
   */
  protected _scale = 1;

  /**
   * shape rotation
   * @protected {number}
   */
  protected _rotation = 0;

  /**
   * point when snapping
   * @protected {Point}
   */
  protected _snappingPoint: Point | null = null;

  /**
   * is ctrl key down
   * @protected {boolean}
   */
  protected _ctrlKey = false;

  /**
   * mouse position when click to drag
   * @private {Point}
   */
  private _dragPoint: Point | null = null;

  /**
   * instance position when click to drag
   * @private {Point}
   */
  private _dragPosistion: Point | null = null;

  /**
   * is instance been dragged
   * @private {boolean}
   */
  private _dragged = false;

  /**
   * is right click down
   * @private {boolean}
   */
  private _rightClicked = false;

  /**
   * is right dragged
   * @private {boolean}
   */
  private _rightDragged = false;

  /**
   * last pivot
   * @private {Point|undefined}
   */
  private _lastPivot: Point | undefined;

  /**
   * global snapping point (not on self shape)
   * @getter
   */
  get globalSnappingPoint() {
    return this.container instanceof Layer ? this.container.snappingPoint : (this.app.stage as Layer).snappingPoint;
  }

  // eslint-disable-next-line class-methods-use-this
  get area() {
    return NaN;
  }

  // TODO: make pivot as abstract getter & setter
  // eslint-disable-next-line class-methods-use-this
  get pivot() {
    return new Point(0, 0);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  set pivot(p: Point) {}

  /**
   * get position
   * @getter
   */
  abstract get position(): Point;

  /**
   * set position
   * @setter
   */
  abstract set position(point: Point);

  /**
   * shape bounds
   * @getter
   */
  abstract get shapeBounds(): { left: number, top: number, right: number, bottom: number };

  /**
   * get color
   * @getter
   */
  get color() {
    return this._color;
  }

  /**
   * set color
   * @setter
   */
  set color(color: number) {
    const shouldUpdate = this._color !== color;
    this._color = color;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get border color
   * @getter
   */
  get borderColor() {
    return this._borderColor;
  }

  /**
   * set border color
   * @setter
   */
  set borderColor(color: number) {
    const shouldUpdate = this._borderColor !== color;
    this._borderColor = color;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get display border color
   * @getter
   */
  get displayBorderColor() {
    if (this.selected) {
      return this.selectedColor;
    }
    if (this.hovered) {
      return this.hoveredColor;
    }
    return this.borderColor;
  }

  /**
   * get alpha
   * @getter
   */
  get alpha() {
    return this._alpha;
  }

  /**
   * set alpha
   * @setter
   */
  set alpha(alpha: number) {
    const newAlpha = alpha > 0 ? alpha : 0.005; // for transparent shape, interactions can't be fired
    const shouldUpdate = this._alpha !== newAlpha;
    this._alpha = newAlpha;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get label
   * @getter
   */
  get label() {
    return this._label;
  }

  /**
   * set label
   * @setter
   */
  set label(label: string) {
    this._label = label;
    this.drawShapeLabel();
  }

  /**
   * get border style
   * @getter
   */
  get borderStyle() {
    return this._borderStyle;
  }

  /**
   * set border style
   * @setter
   */
  set borderStyle(borderStyle: BorderStyle) {
    const shouldUpdate = this._borderStyle !== borderStyle;
    this._borderStyle = borderStyle;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get show vertex
   * @getter
   */
  get showVertex() {
    return this._showVertex;
  }

  /**
   * set show vertex
   * @setter
   */
  set showVertex(showVertex: boolean) {
    const shouldUpdate = this._showVertex !== showVertex;
    this._showVertex = showVertex;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get show vertex order
   * @getter
   */
  get showVertexOrder() {
    return this._showVertexOrder;
  }

  /**
   * set show vertex order
   * @setter
   */
  set showVertexOrder(showVertexOrder: boolean) {
    const shouldUpdate = this._showVertexOrder !== showVertexOrder;
    this._showVertexOrder = showVertexOrder;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get order
   * @getter
   */
  get order() {
    return this._order;
  }

  /**
   * set order
   * @setter
   */
  set order(order: number) {
    this._order = order;
    this._updateShapeContainerOrder();
    if (this.labelDom) {
      this.labelDom.zIndex = order;
    }
  }

  /**
   * get visible
   * @getter
   */
  get visible() {
    return this._visible;
  }

  /**
   * set visible
   * @setter
   */
  set visible(visible: boolean) {
    const shouldUpdate = this._visible !== visible;
    this._visible = visible;
    if (shouldUpdate) {
      this.instance.interactive = visible ? this.interactive : false;
      this.shapeContainer.visible = visible;
      this.controlsContainer.visible = visible;
      if (this._rotateControl) {
        this._rotateControl.control.visible = visible;
      }
      if (this.labelDom) {
        this.labelDom.visible = visible;
      }
    }
  }

  /**
   * get interactive
   * @getter
   */
  get interactive() {
    return this._interactive;
  }

  /**
   * set interactive
   * @setter
   */
  set interactive(interactive: boolean) {
    this._interactive = interactive;
    if (this.instance) {
      this.instance.interactive = interactive;
    }
    this._controls.forEach((c) => {
      c.control.interactive = interactive;
    });
    if (!interactive) {
      this.selected = false;
      this.hovered = false;
    }
  }

  /**
   * get editable
   * @getter
   */
  get editable() {
    return this._editable;
  }

  /**
   * set editable
   * @setter
   */
  set editable(editable: boolean) {
    this._editable = editable;
    this.drawShape();
  }

  /**
   * get rotatable
   * @getter
   */
  get rotatable() {
    return this._rotatable;
  }

  /**
   * set rotatable
   * @setter
   */
  set rotatable(rotatable: boolean) {
    this._rotatable = rotatable;
  }

  /**
   * get shape finished
   * @getter
   */
  get finished() {
    return this._finished;
  }

  /**
   * get selected
   * @getter
   */
  get selected() {
    return this._selected;
  }

  /**
   * set selected
   * @setter
   */
  set selected(selected: boolean) {
    const shouldUpdate = this._selected !== selected;
    this._selected = selected;
    this._updateShapeContainerOrder();
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get hovered
   * @getter
   */
  get hovered() {
    return this._hovered;
  }

  /**
   * set hovered
   * @setter
   */
  set hovered(hovered: boolean) {
    const shouldUpdate = this._hovered !== hovered;
    this._hovered = hovered;
    if (shouldUpdate) {
      this.drawShape();
      this._emit(hovered ? EventAction.POINTER_OVER : EventAction.POINTER_OUT);
    }
    // should update stage cursor because instance cursor not show when covered by others
    if (hovered) {
      this.instance.cursor = this.editable ? Cursor.MOVE : Cursor.POINTER;
    } else {
      this.instance.cursor = Cursor.DEFAULT;
    }
  }

  /**
   * get scale
   * @getter
   */
  get scale() {
    return this._scale;
  }

  /**
   * set scale
   * @setter
   */
  set scale(scale: number) {
    const shouldUpdate = this._scale !== scale;
    this._scale = scale;
    this._controls.forEach((c) => {
      // eslint-disable-next-line no-param-reassign
      c.scale = scale;
    });
    if (this._rotateControl) {
      this._rotateControl.scale = scale;
    }
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * get rotation
   * @getter
   */
  get rotation() {
    return this._rotation;
  }

  /**
   * set rotation
   * @setter
   */
  set rotation(rotation: number) {
    this._rotation = rotation;
    this._updatePosition();
    this.drawShape();
  }

  constructor({
    app,
    container,
    scale,
    color,
    alpha,
    label,
    showVertex,
    showVertexOrder,
    rotatable = false,
    labelDom,
  }: ShapeOptions) {
    this.instance.on('pointerdown', this.processPointerDown);
    this.instance.on('pointerup', this.processPointerUp);
    this.instance.on('pointerupoutside', this.processPointerUp);
    this.instance.on('pointermove', this.processPointerMove);

    this.app = app;
    this.app.view.addEventListener('mousedown', this.processGlobalMouseDown, false);
    document.addEventListener('keydown', this._shapeKeyDown, false);

    this.container = container || app.stage;
    this.instance.interactive = this.interactive;
    this.controlsContainer.zIndex = 9999;
    this.shapeContainer.addChild(this.instance);
    this.container.addChild(this.shapeContainer);
    this.container.addChild(this.controlsContainer);
    this._controlLine.interactive = false;
    this.controlsContainer.addChild(this._controlLine);

    this._scale = scale || app.stage.scale.x;
    if (color !== undefined) {
      this._color = color;
      this._borderColor = color;
    }
    this.originColors = {
      color: this._color,
      borderColor: this._borderColor,
    };
    if (alpha !== undefined) {
      this._alpha = alpha > 0 ? alpha : 0.005;
    }
    if (label !== undefined) {
      this._label = label;
    }
    if (showVertex !== undefined) {
      this._showVertex = showVertex;
    }
    if (showVertexOrder !== undefined) {
      this._showVertexOrder = showVertexOrder;
    }
    this._rotatable = rotatable;
    this.labelDom = labelDom;
  }

  /**
   * update container position
   * @protected
   */
  protected _updatePosition(resize = false) {
    const pivot = this.pivot.clone();
    if (resize && this._lastPivot) {
      // resize change pivot
      const rotatedPivot = computeRotatedPosition(this._lastPivot, pivot, this.rotation);
      pivot.x = rotatedPivot.x;
      pivot.y = rotatedPivot.y;
      this.pivot = pivot;
    }
    this.shapeContainer.pivot.set(pivot.x, pivot.y);
    this.shapeContainer.position.set(pivot.x, pivot.y);
    this.shapeContainer.rotation = this.rotation;
    this._lastPivot = pivot.clone();

    this.controlsContainer.pivot.set(pivot.x, pivot.y);
    this.controlsContainer.position.set(pivot.x, pivot.y);
    this.controlsContainer.rotation = this.rotation;
  };

  /**
   * propogating event to back shapes
   * @param event
   * @param frontTargets
   * @param funcName
   */
  private _continuePropogating(
    event: InteractionEvent,
    frontTargets: Graphics[],
    funcName: 'processPointerDown' | 'processPointerUp',
  ) {
    this.instance.interactive = false;
    const { interaction } = this.app.renderer.plugins;
    const hit = interaction.hitTest(event.data.global);
    if (hit && hit instanceof ShapeGraphics && !frontTargets.includes(this.instance)) {
      hit.shape[funcName](event, [...frontTargets, this.instance]);
    }
    this.instance.interactive = true;
  }

  /**
   * process pointerdown
   * @param event
   * @param frontTargets
   */
  processPointerDown = (event: InteractionEvent, frontTargets: Graphics[] = []) => {
    if (event.data.button === 2) {
      this._rightClicked = true;
      this._continuePropogating(event, frontTargets, 'processPointerDown');
      return;
    }

    if (this.hovered) {
      event.stopPropagation();
      const p = event.data.getLocalPosition(this.container);
      this._dragPoint = new Point(p.x, p.y);
      this._dragPosistion = this.position;
      this._dragged = false;
      this.selected = true;
      this._emit(EventAction.SELECTED, p);
      // disable controls interactivity when first pointer down to selected (avoid bugs when start dragging on controls)
      this._controls.forEach((c) => {
        c.control.interactive = false;
      });
    }

    if (!this._snappingPoint) { // if upper shapes has snapping point, do not propogating
      this._continuePropogating(event, frontTargets, 'processPointerDown');
    }
  };

  /**
   * process pointerup
   * @param event
   * @param frontTargets
   */
  processPointerUp = (event: InteractionEvent, frontTargets: Graphics[] = []) => {
    if (event.data.button === 2 && this._rightClicked && !this._rightDragged) {
      if (this.hovered && !this.selected) {
        const p = event.data.getLocalPosition(this.container);
        this.selected = true;
        this._emit(EventAction.SELECTED, p);
      }
    }

    // re-active controls when pointer up
    this._controls.forEach((c) => {
      c.control.interactive = true;
    });
    this.dragging = false;
    this._dragPoint = null;
    this._dragPosistion = null;
    if (this._dragged) {
      this._changed();
      this._dragged = false;
    }
    this._rightClicked = false;
    this._rightDragged = false;
    this._continuePropogating(event, frontTargets, 'processPointerUp');
  };

  /**
   * process pointermove
   * @param event
   */
  processPointerMove = (event: InteractionEvent) => {
    if (event.data.buttons === 2 && this._rightClicked) {
      this._rightDragged = true;
      return;
    }
    if (this.editable && this.selected && this.snap(event)) {
      // snapping
      this.instance.cursor = Cursor.DEFAULT;
    } else if (this.editable && this.selected && this._dragPoint && this._dragPosistion) {
      // dragging
      this._dragged = true;
      this._ctrlKey = event.data.originalEvent.ctrlKey;
      const point = event.data.getLocalPosition(this.container);
      const originX = this.position.x;
      const originY = this.position.y;
      const position = new Point(
        this._dragPosistion.x + (point.x - this._dragPoint.x),
        this._dragPosistion.y + (point.y - this._dragPoint.y),
      );
      // prefer to use global snapping point if moving a dot
      this.position = (this.shapeType === ShapeType.DOT && this.globalSnappingPoint) ? this.globalSnappingPoint : position;
      this._updatePosition();
      this._dragging({ deltaX: this.position.x - originX, deltaY: this.position.y - originY });
    }
  };

  /**
   * process app mouse down
   */
  processGlobalMouseDown = () => {
    if (this._snappingPoint) {
      const success = this.addSnappingPointToShape();
      if (success) {
        // set selected
        this.selected = true;
        this._emit(EventAction.SELECTED);
        // ignore drag start
        this._dragPoint = null;
        this._dragPosistion = null;
      }
    }
  };

  /**
   * actual draw the shape on canvas
   */
  abstract drawShape(): void;

  /**
   * start shape create
   * @param point create start point
   * @param options options used for creation
   */
  abstract create(point?: Point, options?: any): void;

  /**
   * get label position of the shape
   */
  abstract getLabelPosition(): Point;

  /**
   * get shape data
   */
  abstract getData(): T;

  /**
   * get shape Geo JSON (multi polygon)
   */
  abstract getAreaAsGeoJSON(): Geom;

  /**
   * delete selected points in shape, default reture false and can be overwritten in sub class
   */
  deleteSelectedPoints() {
    return false; // false means no point deleted
  }

  /**
   * snap to shape vertexes or edges
   * @param point
   * @param tolerance
   */
  snapToPoint(point: Point, tolerance?: number): Point | null {
    return null;
  }

  /**
   * snap to shape edges
   * @param point
   */
  snap(event: InteractionEvent) {
    this._snappingPoint = null;
    return false;
  }

  /**
   * add snapping point to shape
   */
  addSnappingPointToShape() {
    return false;
  }

  /**
   * draw shape label
   */
  drawShapeLabel() {
    const borderOffset = this.shapeType !== ShapeType.DOT ? 1 / 2 : 0;
    const vertexOffset = (
      this.shapeType === ShapeType.POLYGON ||
      this.shapeType === ShapeType.LINE ||
      this.shapeType === ShapeType.RECTANGLE
    ) && this.showVertex ? 4 : 0;

    if (this.labelDom) {
      // use dom to render
      if (this.label) {
        this.labelDom.text = this.label;
        this.labelDom.zIndex = this.order;

        const position = this.getLabelPosition();
        const globalPosition = this.container.toGlobal({ x: position.x, y: position.y - (borderOffset + vertexOffset) / this.scale });
        const globalPivot = this.container.toGlobal(this.pivot);
        this.labelDom.setPosition(globalPosition, globalPivot, this.rotation);
      }
    } else if (this.label) {
      if (!this.labelContainer) {
        this._createLabelContainer();
      } else {
        this.labelContainer.removeChildren();
      }

      const { x, y } = this.getLabelPosition();
      this.labelContainer!.position.x = x;
      this.labelContainer!.position.y = y - (18 + borderOffset + vertexOffset) / this.scale;
      this.labelContainer!.scale.set(1 / this.scale);

      const text = new Text(` ${this.label} `, {
        fontSize: 14,
        lineHeight: 18,
        fill: '#FFFFFF',
      });

      const { width, height } = text.getBounds();
      const bounds = new Graphics();
      bounds.beginFill(0, 0.6);
      bounds.drawRect(0, 0, width, height);
      bounds.endFill();
      this.labelContainer!.addChild(bounds);
      this.labelContainer!.addChild(text);
    }
  }

  /**
   * finish shape create
   * @param otherShapeData
   * @protected
   */
  protected _finish(otherShapeData?: ShapeData[]) {
    if (!this.destroyed) {
      this._finished = true;
      this.drawShape();
      this._emit(EventAction.FINISHED, otherShapeData);
    }
  }

  /**
   * remove shape from canvas
   * @protected
   */
  protected _remove() {
    this._emit(EventAction.REMOVED);
    this.destroy();
  }

  /**
   * when shape move & resize
   * @protected
   */
  protected _changed() {
    this._emit(EventAction.CHANGED, this.getData());
  }

  /**
   * when shape is been dragging
   * @param data
   * @protected
   */
  protected _dragging(data?: { deltaX: number; deltaY: number }) {
    this.dragging = true;
  }

  /**
   * when shape is reszing
   * @param data
   * @protected
   */
  protected _resizing(data?: { deltaX: number; deltaY: number }) {
    this.resizing = true;
  }

  /**
   * get global position
   * @returns
   */
  getGlobalPosition() {
    const { left, right, top, bottom } = this.shapeBounds;
    const center = new Point(left + (right - left) / 2, top + (bottom - top) / 2);
    const { x, y } = this.container.toGlobal(center);
    return { x, y };
  }

  /**
   * find intersections
   * @param shapes
   */
  findIntersections(shapes: Shape<ShapeData>[]) {
    const currentShapeData = this.getAreaAsGeoJSON();
    const filteredShapes = shapes.filter((s) => s.uid !== this.uid);
    return findIntersections(currentShapeData, this.shapeBounds, this.shapeType, filteredShapes);
  }

  /**
   * update shape position
   * @param x
   * @param y
   */
  updatePosition(x: number, y: number) {
    this.position = new Point(x, y);
    this._updatePosition();
  }

  /**
   * destroy shape
   */
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.app.view.removeEventListener('mousedown', this.processGlobalMouseDown, false);
    document.removeEventListener('keydown', this._shapeKeyDown, false);
    // remove all listeners
    Object.values(EventAction).forEach((action) => {
      this.off(action);
    });
    // remove controls
    this._controls = [];
    if (this._rotateControl) {
      this._rotateControl.destroy();
    }
    // destroy containers
    [
      this.controlsContainer,
      this.shapeContainer,
    ]
      .forEach((container) => {
        this.container.removeChild(container);
        container.destroy({
          children: true,
          texture: true,
          baseTexture: true,
        });
      });
    // remove dom if possible
    if (this.labelDom) {
      this.labelDom.remove();
      this.labelDom = undefined;
    }
    this.destroyed = true;
  }

  /**
   * remove controls
   */
  removeControls() {
    // remove control points
    this._controls.forEach((c) => {
      c.remove();
    });
    this._controls = [];
    // remove rotate control
    if (this._rotateControl) {
      this._rotateControl.remove();
    }
  }

  /**
   * emit event
   * @protected
   * @param eventName
   */
  protected _emit(eventName: string, ...args: any[]) {
    this._eventEmitter.emit(eventName, this, ...args);
  }

  /**
   * add listener
   * @param eventName
   * @param callback
   */
  on(eventName: string, callback: (shape: Shape<T>, ...args: any[]) => void) {
    this._eventEmitter.on(eventName, callback);
    return this;
  }

  /**
   * remove listener
   * @param eventName
   * @param callback
   */
  off(eventName: string, callback?: (shape: Shape<T>, ...args: any[]) => void) {
    if (callback) {
      this._eventEmitter.removeListener(eventName, callback);
    } else {
      this._eventEmitter.removeAllListeners(eventName);
    }
    return this;
  }

  /**
   * map screen position to stage position as a PIXI point
   * @protected
   * @param x screen position x
   * @param y screen position y
   */
  protected _mapScreenToStagePosition(x: number, y: number) {
    const point = new Point();
    this.app.renderer.plugins.interaction.mapPositionToPoint(point, x, y);
    return point;
  }

  /**
   * map stage position to local posistion as a PIXI point
   * @protected
   * @param point
   */
  protected _mapStageToLocalPosition(point: Point) {
    return this.container.toLocal(point);
  }

  /**
   * update shape container order
   */
  private _updateShapeContainerOrder() {
    if (this.shapeType === ShapeType.DOT
      || this.shapeType === ShapeType.LINE) {
      this.shapeContainer.zIndex = this.selected ? 9999 : this.order;
    } else {
      this.shapeContainer.zIndex = this.order;
    }
  }

  /**
   * create label container
   * @protected
   */
  protected _createLabelContainer() {
    this.labelContainer = new Container();
    this.labelContainer.interactive = false;
    this.shapeContainer.addChild(this.labelContainer);
  }

  /**
   * create vertexes container
   * @protected
   */
  protected _createVertexesContainer() {
    this.vertexesContainer = new Container();
    this.vertexesContainer.interactive = false;
    this.shapeContainer.addChild(this.vertexesContainer);
  }

  /**
   * key down handler
   * @protected
   * @param e
   */
  protected _shapeKeyDown = (e: KeyboardEvent) => {
    if (this.finished && this.selected && this.editable && e.shiftKey) {
      let deltaX = 0;
      let deltaY = 0;
      let rotation = 0;
      switch (e.key?.toLowerCase()) {
        case 'w':
          deltaY = -1;
          break;
        case 'a':
          deltaX = -1;
          break;
        case 's':
          deltaY = 1;
          break;
        case 'd':
          deltaX = 1;
          break;
        case 'q':
          rotation = -1;
          break;
        case 'e':
          rotation = 1;
          break;
        default:
          break;
      }
      if (deltaX !== 0 || deltaY !== 0) {
        e.preventDefault();
        this.position = new Point(
          this.position.x + deltaX,
          this.position.y + deltaY,
        );
        this._updatePosition();
        this._changed();
      }

      if (rotation !== 0 && this.rotatable) {
        e.preventDefault();
        this.rotation += rotation * (Math.PI / 180);
        this._changed();
      }
    }
  };
}
