import { Point } from 'pixi.js';
import Flatten from '@flatten-js/core';
import Shape, { ShapeOptions } from './Shape';
import { ShapeType } from './types';
import ControlPoint from './controls/ControlPoint';
import ControlBar from './controls/ControlBar';
import ControlRotation from './controls/ControlRotation';
import { precise } from './utils';
import Cursor from '../Cursor';
import { computeRotatedPosition } from '../../../utils/math';

export interface RectangleData {
  x: number;
  y: number;
  width: number;
  height: number;
  points: {x: number, y: number}[];
  rotation?: number;
}

export interface RectangleOptions extends ShapeOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Rectangle shape
 * @class
 */
export default class Rectangle extends Shape<RectangleData> {
  shapeType = ShapeType.RECTANGLE;

  /**
   * LT vertex position x
   * @private
   */
  private _x: number | undefined;

  /**
   * LT vertex position y
   * @private
   */
  private _y: number | undefined;

  /**
   * rectangle width
   * @private
   */
  private _width: number | undefined;

  /**
   * rectangle height
   * @private
   */
  private _height: number | undefined;

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
    this.normalize();
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
    this.normalize();
  }

  /**
   * get width
   * @getter
   */
  get width() {
    return this._width || 0;
  }

  /**
   * set width
   * @setter
   */
  set width(width: number) {
    this._width = width;
    this.normalize();
  }

  /**
   * get height
   * @getter
   */
  get height() {
    return this._height || 0;
  }

  /**
   * set height
   * @setter
   */
  set height(height: number) {
    this._height = height;
    this.normalize();
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
  set position(point: Point) {
    if (this.x !== point.x || this.y !== point.y) {
      this._x = precise(point.x);
      this._y = precise(point.y);
      this.drawShape();
    }
  }

  /**
   * get pivot
   * @getter
   */
  get pivot() {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }

  /**
   * set pivot
   * @setter
   */
  set pivot(point: Point) {
    const { x: px, y: py } = this.pivot;
    const shouldUpdate = point.x !== px || point.y !== py;
    this._x = point.x - this.width / 2;
    this._y = point.y - this.height / 2;
    if (shouldUpdate) {
      this.drawShape();
    }
  }

  /**
   * shape bounds
   * @getter
   */
  get shapeBounds() {
    const rotatedPoints = this.getRotatedPoints();
    const left = Math.min(...rotatedPoints.map((p) => p.x));
    const right = Math.max(...rotatedPoints.map((p) => p.x));
    const top = Math.min(...rotatedPoints.map((p) => p.y));
    const bottom = Math.max(...rotatedPoints.map((p) => p.y));
    return { left, top, right, bottom };
  }

  /**
   * shape area
   * @getter
   */
  get area() {
    return this.width * this.height;
  }

  constructor(options: RectangleOptions) {
    super(options);

    const { x, y, width, height } = options;

    if (x !== undefined && y !== undefined && width !== undefined && height !== undefined) {
      this._x = x;
      this._y = y;
      this._width = width;
      this._height = height;
      this.normalize();
    }
  }

  /**
   * draw shape
   */
  drawShape() {
    this.instance.clear();
    this._controlLine.clear();
    this._drawShapeFill();
    this._drawShapeLine();
    if (this._finished) {
      this.drawShapeLabel();
      this.attachControlPoints();
    }
  }

  /**
   * draw shape fill
   */
  private _drawShapeFill() {
    this.instance.beginFill(this.color, this.alpha);
    this.instance.drawRect(this.x, this.y, this.width, this.height);
    this.instance.endFill();
  }

  /**
   * draw shape border
   */
  private _drawShapeLine() {
    const ctx = this.selected ? this._controlLine : this.instance;
    const baseWidth = 1 / this.scale;
    const color = this.displayBorderColor;
    ctx.moveTo(this.x, this.y);
    ctx.lineStyle(baseWidth, color);
    ctx.drawLine(this.x + this.width, this.y, this.borderStyle, this.scale);
    ctx.lineStyle(baseWidth, color);
    ctx.drawLine(this.x + this.width, this.y + this.height, this.borderStyle, this.scale);
    ctx.lineStyle(baseWidth, color);
    ctx.drawLine(this.x, this.y + this.height, this.borderStyle, this.scale);
    ctx.lineStyle(baseWidth, color);
    ctx.drawLine(this.x, this.y, this.borderStyle, this.scale);
  }

  /**
   * drag to create
   */
  create() {
    this._finished = false;
    document.addEventListener('mousemove', this.mouseMove, false);
    document.addEventListener('mouseup', this.mouseUp, false);
  }

  /**
   * mouse move when creating
   */
  mouseMove = (event: MouseEvent) => {
    const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
    const localPoint = this._mapStageToLocalPosition(point);
    this._draw(localPoint);
  };

  /**
   * mouse up when creating
   */
  mouseUp = () => {
    this.normalize();
    this._finish();
    document.removeEventListener('mousemove', this.mouseMove, false);
    document.removeEventListener('mouseup', this.mouseUp, false);
  };

  /**
   * get label position
   */
  getLabelPosition() {
    return this.position;
  }

  /**
   * get shape data
   */
  getData() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      points: this.getRotatedPoints(),
    };
  }

  /**
   * get geo json
   */
  getAreaAsGeoJSON() {
    const rotatedPoints = this.getRotatedPoints();
    return [[rotatedPoints.map((p) => [p.x, p.y] as [number, number])]];
  }

  /**
   * attach control points
   */
  attachControlPoints() {
    if (!this.editable) {
      this.removeControls();
      return;
    }

    if (this.selected) {
      const points = this.getPoints();
      const edgePoints = points.map((point, index) => {
        const nextPoint = points[index + 1 < 4 ? index + 1 : 0];
        return {
          x: (point.x + nextPoint.x) / 2,
          y: (point.y + nextPoint.y) / 2,
        };
      });

      edgePoints.forEach((point, index) => {
        const i = index + 4;
        const size = index % 2 === 0 ? this.width : this.height;
        if (!this._controls[i]) {
          this._controls[i] = new ControlBar({
            type: index % 2 === 0 ? 'horizonal' : 'vertical',
            size,
            position: point,
            container: this.controlsContainer,
            scale: this.scale,
            color: this.selectedColor,
            cursor: this.getCursor(i),
            onPositionChange: (x, y) => this._updateByBarPosition(index, x, y),
            onFinish: () => this._finishResize(),
          });
        } else {
          this._controls[i].cursor = this.getCursor(i);
          this._controls[i].position = point;
          this._controls[i].size = size;
        }
        this._controls[i].add();
      });

      points.forEach((point, index) => {
        // create if never created before
        if (!this._controls[index]) {
          this._controls[index] = new ControlPoint({
            position: point,
            container: this.controlsContainer,
            scale: this.scale,
            color: this.selectedColor,
            cursor: this.getCursor(index),
            onPositionChange: (x, y) => this._updateByPointPosition(index, x, y),
            onFinish: () => this._finishResize(),
          });
        } else {
          // update
          this._controls[index].cursor = this.getCursor(index);
          this._controls[index].position = point;
        }
        this._controls[index].add();
      });

      if (this.rotatable) {
        const size = this.pivot.y - Math.abs(this.height) / 2 - 50 / this.scale;
        if (!this._rotateControl) {
          this._rotateControl = new ControlRotation({
            container: this.container,
            position: this.pivot,
            size,
            rotation: this.shapeContainer.rotation,
            scale: this.scale,
            color: this.selectedColor,
            onRotationChange: (angle) => {
              if (this.rotation !== undefined) {
                this.rotation += angle;
                if (this.rotation >= Math.PI) {
                  this.rotation -= 2 * Math.PI;
                }
                if (this.rotation <= -Math.PI) {
                  this.rotation += 2 * Math.PI;
                }
              }
            },
            onFinish: () => {
              this._changed();
            }
          });
        }
        this._rotateControl.rotation = this.shapeContainer.rotation;
        this._rotateControl.position = this.pivot;
        this._rotateControl.size = size;
        this._rotateControl.add();
      }
    } else {
      this.removeControls();
    }
  }

  /**
   * update rectangle x, y, width, height by dragging point
   * @private
   * @param index point index
   * @param x new position x
   * @param y new position y
   * @param event
   */
  private _updateByPointPosition(index: number, x: number, y: number) {
    const position = new Point(x, y);
    const points = this.getPoints();
    const offsetX = position.x - points[index].x;
    const offsetY = position.y - points[index].y;
    if (this._x !== undefined && this._y !== undefined && this._width !== undefined && this._height !== undefined) {
      switch (index) {
        case 0:
          this._x = position.x;
          this._y = position.y;
          this._width -= offsetX;
          this._height -= offsetY;
          break;
        case 1:
          this._y += position.y - this._y;
          this._width += offsetX;
          this._height -= offsetY;
          break;
        case 2:
          this._width += offsetX;
          this._height += offsetY;
          break;
        case 3:
          this._x += position.x - this._x;
          this._width -= offsetX;
          this._height += offsetY;
          break;
        default:
      }
      this.drawShape();
      this._updatePosition(true);
      this._resizing();
    }
  }

  /**
   * update rectangle x, y, width, height by dragging edge
   * @param index edge index, top -> right -> bottom -> left
   * @param x new position x
   * @param y new position y
   * @param event
   */
  private _updateByBarPosition(index: number, x: number, y: number) {
    const position = new Point(x, y);
    if (this._x !== undefined && this._y !== undefined && this._width !== undefined && this._height !== undefined) {
      const offsetX = position.x - this._x;
      const offsetY = position.y - this._y;
      switch (index) {
        case 0:
          this._y = position.y;
          this._height -= offsetY;
          break;
        case 1:
          this._width = offsetX;
          break;
        case 2:
          this._height = offsetY;
          break;
        case 3:
          this._x = position.x;
          this._width -= offsetX;
          break;
        default:
      }
      this.drawShape();
      this._updatePosition(true);
      this._resizing();
    }
  }

  /**
   * when finish resize
   */
  private _finishResize() {
    this.resizing = false;
    this.normalize();
    this._changed();
  }

  /**
   * draw shape by the position
   * @private
   * @param point mouse position
   */
  private _draw(point: Point) {
    const p = point;
    if (this._x === undefined || this._y === undefined) {
      this._x = p.x;
      this._y = p.y;
    } else {
      this._width = p.x - this._x;
      this._height = p.y - this._y;
    }
    this.drawShape();
  }

  /**
   * normalize rectangle shape, remove it if necessary
   */
  normalize() {
    if (this._x === undefined || this._y === undefined || !this._width || !this._height) {
      this._remove();
      return;
    }

    if (this._width < 0) {
      this._x += this._width;
      this._width = Math.abs(this._width);
    }
    if (this._height < 0) {
      this._y += this._height;
      this._height = Math.abs(this._height);
    }
    this._x = precise(this._x);
    this._y = precise(this._y);
    this._width = precise(this._width);
    this._height = precise(this._height);

    this.drawShape();
  }

  /**
   * get control cursor
   * @returns corsor
   */
  getCursor(index: number):Cursor {
    const rotateMultiple = Math.round(this.rotation / (Math.PI / 4));
    let cursor = Cursor.DEFAULT;
    switch (rotateMultiple) {
      case 0:
      case 4:
      case -4:
        if (index < 4) {
          cursor = index % 2 === 0 ? Cursor.NWSE_RESIZE : Cursor.NESW_RESIZE;
        } else {
          cursor = index % 2 === 0 ? Cursor.NS_RESIZE : Cursor.EW_RESIZE;
        }
        break;
      case 2:
      case -2:
        if (index < 4) {
          cursor = index % 2 === 0 ? Cursor.NESW_RESIZE : Cursor.NWSE_RESIZE;
        } else {
          cursor = index % 2 === 0 ? Cursor.EW_RESIZE : Cursor.NS_RESIZE;
        }
        break;
      case 1:
      case -3:
        if (index < 4) {
          cursor = index % 2 === 0 ? Cursor.NS_RESIZE : Cursor.EW_RESIZE;
        } else {
          cursor = index % 2 === 0 ? Cursor.NESW_RESIZE : Cursor.NWSE_RESIZE;
        }
        break;
      case -1:
      case 3:
        if (index < 4) {
          cursor = index % 2 === 0 ? Cursor.EW_RESIZE : Cursor.NS_RESIZE;
        } else {
          cursor = index % 2 === 0 ? Cursor.NWSE_RESIZE : Cursor.NESW_RESIZE;
        }
        break;
      default:
        break;
    }
    return cursor;
  }

  /**
   * get 4 points based on the position and size
   */
  getPoints() {
    const right = precise(this.x + this.width);
    const bottom = precise(this.y + this.height);
    return [
      { x: this.x, y: this.y },
      { x: right, y: this.y },
      { x: right, y: bottom },
      { x: this.x, y: bottom },
    ];
  }

  /**
   * get actual 4 points position
   */
  getRotatedPoints() {
    const points = this.getPoints();
    if (this.rotation !== 0) {
      points.forEach((p) => {
        const point = computeRotatedPosition(this.pivot, p, this.rotation);
        p.x = precise(point.x);
        p.y = precise(point.y);
      });
    }
    return points;
  }

  /**
   * snap to point
   * @param point
   * @param tolerance
   */
  snapToPoint(point: Point, tolerance = 8) {
    const t = tolerance / this.scale;

    // bbox
    const { x, y } = point;
    const { left, right, top, bottom } = this.shapeBounds;
    if (x < left - t || x > right + t || y < top - t || y > bottom + t) {
      return null;
    }

    const points = this.getRotatedPoints();
    // points
    let nearestPoint: { x: number; y: number; } | undefined;
    let d: number | undefined;
    points.forEach((p) => {
      const pointDistance = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      if (pointDistance < t && (d === undefined || pointDistance < d)) {
        d = pointDistance;
        nearestPoint = p;
      }
    });
    if (nearestPoint) {
      return new Point(nearestPoint.x, nearestPoint.y);
    }

    // edges
    const location = new Flatten.Point(x, y);
    for (let i = 0; i < points.length; i += 1) {
      const startPoint = new Flatten.Point(points[i].x, points[i].y);
      const endPoint = new Flatten.Point(points[(i + 1) % 4].x, points[(i + 1) % 4].y);
      const line = new Flatten.Segment(startPoint, endPoint);
      const [distance, segment] = line.distanceTo(location);
      if (distance < t) {
        const { ps, pe } = segment;
        const edgePoint = ps.equalTo(location) ? pe : ps;
        return new Point(edgePoint.x, edgePoint.y);
      }
    }

    return null;
  }

  /**
   * shape destroy
   */
  destroy() {
    document.removeEventListener('mousemove', this.mouseMove, false);
    document.removeEventListener('mouseup', this.mouseUp, false);
    // call parent
    super.destroy();
  }
}
