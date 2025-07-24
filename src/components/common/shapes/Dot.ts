import { Point } from 'pixi.js';
import Shape, { BorderStyle, ShapeOptions } from './Shape';
import { ShapeType } from './types';
import { precise } from './utils';

export interface DotData {
  x: number;
  y: number;
}

export interface DotOptions extends ShapeOptions {
  x?: number;
  y?: number;
}

/**
 * Dot shape
 * @class
 */
export default class Dot extends Shape<DotData> {
  shapeType = ShapeType.DOT;

  /**
   * position x
   * @private
   */
  private _x: number | undefined;

  /**
  * position y
  * @private
  */
  private _y: number | undefined;

  /**
   * get x
   * @getter
   */
  get x() {
    return this._x || 0;
  }

  /**
   * set x
   * @setter
   */
  set x(x: number) {
    this._x = x;
    this.drawShape();
  }

  /**
   * get y
   * @getter
   */
  get y() {
    return this._y || 0;
  }

  /**
   * set y
   * @setter
   */
  set y(y: number) {
    this._y = y;
    this.drawShape();
  }

  /**
   * get position
   * @getter
   */
  get position() {
    return new Point(this.x, this.y);
  }

  /**
   * set position
   * @setter
   */
  set position(position: Point) {
    if (this._x !== position.x || this._y !== position.y) {
      this._x = precise(position.x);
      this._y = precise(position.y);
      this.drawShape();
    }
  }

  /**
   * get dot border width
   * @getter
   */
  get dotWidth() {
    const radius = Math.ceil(5 / 2);
    return this.selected ? radius + 1 : radius;
  }

  /**
   * get dot shape radius
   * @getter
   */
  get dotInnerRadius() {
    const radius = Math.floor(5 / 2);
    return this.selected ? radius + 1 : radius;
  }

  /**
   * shape bounds
   * @getter
   */
  get shapeBounds() {
    return { left: this.x, top: this.y, right: this.x, bottom: this.y };
  }

  /**
   * shape color
   * @getter
   */
  get displayColor() {
    if (this.selected) {
      return this.selectedColor;
    }
    if (this.hovered) {
      return this.hoveredColor;
    }
    return this.color;
  }

  constructor(options: DotOptions) {
    super(options);

    const { x, y } = options;
    if (x !== undefined && y !== undefined) {
      this._x = precise(x);
      this._y = precise(y);
    }
    this.drawShape();
  }

  /**
   * drag to create
   */
  create() {
    const mouseUp = (event: MouseEvent) => {
      let localPoint = this.globalSnappingPoint;
      if (!localPoint) {
        const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
        localPoint = this._mapStageToLocalPosition(point);
      }
      const { x, y } = localPoint;
      this._x = precise(x);
      this._y = precise(y);
      this.drawShape();
      this._finish();

      document.removeEventListener('mouseup', mouseUp, false);
    };

    document.addEventListener('mouseup', mouseUp, false);
    this._finished = false;
  }

  /**
   * draw shape
   */
  drawShape() {
    this.instance.clear();
    if (this._x === undefined || this._y === undefined) {
      return;
    }

    this.instance.scale.set(1 / this.scale, 1 / this.scale);
    this.instance.pivot.set(this.x, this.y);
    this.instance.position.set(this.x, this.y);

    this.instance.beginFill(this.displayColor, this.borderStyle === BorderStyle.DASHED ? 0.2 : 1);
    this.instance.drawVertex(this.x, this.y, this.dotInnerRadius + this.dotWidth);
    this.instance.endFill();
    this.instance.beginFill(0x252935);
    this.instance.drawVertex(this.x, this.y, this.dotInnerRadius);
    this.instance.endFill();
    if (this.borderStyle === BorderStyle.DASHED) {
      this._drawDashBorder();
    }

    if (this._finished) {
      this.drawShapeLabel();
    }
  }

  /**
   * draw dot dash border
   */
  _drawDashBorder() {
    const radius = this.dotInnerRadius + this.dotWidth;
    const kappa = 0.5522848;
    const x = this.x - radius;
    const y = this.y - radius;
    const ox = radius * kappa;
    const oy = radius * kappa;
    const xe = x + radius * 2;
    const ye = y + radius * 2;
    const xm = this.x;
    const ym = this.y;

    this.instance.lineStyle(1, this.displayColor);
    this.instance.moveTo(x, ym);
    this.instance.dashBezierCurveTo(x, ym - oy, xm - ox, y, xm, y, 1, 3, 2);
    this.instance.dashBezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym, 1, 3, 2);
    this.instance.dashBezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye, 1, 3, 2);
    this.instance.dashBezierCurveTo(xm - ox, ye, x, ym + oy, x, ym, 1, 3, 2);
  }

  /**
   * get shape data
   */
  getData() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  /**
   * get geo json
   */
  getAreaAsGeoJSON() {
    return [[[[this.x, this.y] as [number, number]]]];
  }

  /**
   * get label position
   */
  getLabelPosition() {
    return new Point(this.x, this.y - 7 / this.scale);
  }

  /**
   * snap to point
   * @param point
   * @param tolerance
   */
  snapToPoint(point: Point, tolerance = 8) {
    const t = tolerance / this.scale;
    const pointDistance = Math.sqrt((this.x - point.x) ** 2 + (this.y - point.y) ** 2);
    if (pointDistance < t) {
      return new Point(this.x, this.y);
    }
    return null;
  }
}
