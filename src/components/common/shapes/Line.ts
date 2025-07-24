import { Point, BitmapText, InteractionEvent, Polygon } from 'pixi.js';
import Flatten from '@flatten-js/core';
import { cloneDeep } from 'lodash';
import Shape, { ShapeOptions, EventAction } from './Shape';
import { ShapeType } from './types';
import ControlPoint from './controls/ControlPoint';
import { precise } from './utils';
import Cursor from '../Cursor';
import { calcOutlineForLine } from '../../../utils/vector';

interface IPoint {
  x: number;
  y: number;
  userData?: any;
}

export interface LineData {
  points: IPoint[];
}

export interface LineOptions extends ShapeOptions {
  points?: IPoint[];
}

/**
 * Line shape
 * @class
 */
export default class Line extends Shape<LineData> {
  shapeType = ShapeType.LINE;

  /**
   * line points
   * @protected
   */
  protected _points: IPoint[] = [];

  /**
   * indicate next point when creating
   * @protected
   */
  protected _nextPoint: IPoint | null = null;

  /**
   * line geometory data (line array)
   */
  private _geometory: Flatten.Segment[] = [];

  /**
   * index of lines when snapped
   */
  private _snappingIndex = -1;

  /**
   * get points
   * @getter
   */
  get points() {
    return this._points.map((p) => ({
      x: p.x,
      y: p.y,
      ...p.userData && { userData: p.userData },
    }));
  }

  /**
   * set points
   * @setter
   */
  set points(points: IPoint[]) {
    this._points = points.map((p) => ({ x: p.x, y: p.y, userData: cloneDeep(p.userData) }));
    this.normalize();
  }

  /**
   * get position
   * @getter
   */
  get position() {
    return new Point(this._points[0].x, this._points[0].y);
  }

  /**
   * set position
   * @setter
   */
  set position(point: Point) {
    const offsetX = point.x - this._points[0].x;
    const offsetY = point.y - this._points[0].y;
    this._points.forEach((p) => {
      p.x = precise(p.x + offsetX);
      p.y = precise(p.y + offsetY);
    });
    this.updateGeometory();
    this.drawShape();
  }

  /**
   * shape bounds
   * @getter
   */
  get shapeBounds() {
    const linePoints = this.points;
    const left = Math.min(...linePoints.map((p) => p.x));
    const right = Math.max(...linePoints.map((p) => p.x));
    const top = Math.min(...linePoints.map((p) => p.y));
    const bottom = Math.max(...linePoints.map((p) => p.y));
    return { left, top, right, bottom };
  }

  constructor(options: LineOptions) {
    super(options);

    const { points } = options;
    if (Array.isArray(points) && points.every((p) => p.x !== undefined && p.y !== undefined)) {
      this.points = points;
    }

    document.addEventListener('keydown', this._keyDown, false);
  }

  /**
   * draw shape
   */
  drawShape() {
    this.instance.clear();
    this._drawShapeLine();
    this._drawShapeVertex();
    this._drawSnappingPoint();
    if (this._finished) {
      this.drawShapeLabel();
      this.attachControlPoints();
      this.updateHitArea();
    }
  }

  /**
   * draw shape border
   * @protected
   */
  protected _drawShapeLine() {
    if (this._points.length <= 0) {
      return;
    }
    const baseWidth = 1 / this.scale;
    const color = this.displayBorderColor;

    let i = 0;
    this.instance.moveTo(this._points[0].x, this._points[0].y);
    this._points.slice(1).forEach((point) => {
      this.instance.lineStyle(baseWidth, color);
      this.instance.drawLine(point.x, point.y, this.borderStyle, this.scale);
      i += 1;
    });
    if ((!this._finished) && this._nextPoint) {
      this.instance.lineStyle(baseWidth, color);
      this.instance.drawLine(this._nextPoint.x, this._nextPoint.y, this.borderStyle, this.scale);
    }
  }

  /**
   * draw shape vertexes
   * @protected
   */
  protected _drawShapeVertex() {
    this.vertexesContainer?.removeChildren();
    if (!this.showVertex && !this.showVertexOrder) {
      return;
    }

    const r = 4 / this.scale;
    const offset = this.showVertex ? r : 4 / this.scale;
    this.instance.lineStyle(1 / this.scale, this.displayBorderColor);
    this._points.forEach((point, index) => {
      if (this.showVertex && (!this.editable || !this.selected)) {
        // draw vertex dot
        this.instance.beginFill(this.color);
        this.instance.drawVertex(point.x, point.y, r);
        this.instance.endFill();
      }
      if (this.showVertexOrder) {
        // draw vertext order
        const text = new BitmapText(`${1 + index} `, { fontName: 'ALPHA_NUMERIC' });
        text.scale.set(1 / this.scale);
        text.position.set(point.x + offset, point.y + offset);
        if (!this.vertexesContainer) {
          this._createVertexesContainer();
        }
        this.vertexesContainer!.addChild(text);
      }
    });
  }

  /**
   * draw snapping point
   */
  private _drawSnappingPoint() {
    if (this._snappingPoint) {
      this.instance.beginFill(this.selectedColor);
      this.instance.drawCircle(this._snappingPoint.x, this._snappingPoint.y, 3 / this.scale);
      this.instance.endFill();
    }
  }

  /**
   * create by click to add point
   * @param point
   */
  create() {
    document.addEventListener('mousemove', this._mouseMove, false);
    document.addEventListener('mouseup', this._mouseUp, false);
    this.app.view.addEventListener('dblclick', this._finishByDoubleClick, false);

    this._finished = false;
    this._nextPoint = null;
  }

  /**
   * mouse move listener when creating
   * @private
   * @param event
   */
  private _mouseMove = (event: MouseEvent) => {
    let localPoint = this.globalSnappingPoint;
    if (!localPoint) {
      const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
      localPoint = this._mapStageToLocalPosition(point);
    }
    this._nextPoint = localPoint;
    this.drawShape();
  };

  /**
   * mouse up listener when creating
   * @private
   * @param event
   */
  private _mouseUp = (event: MouseEvent) => {
    if (event.button === 2) {
      return;
    }
    let localPoint = this.globalSnappingPoint;
    if (!localPoint) {
      const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
      localPoint = this._mapStageToLocalPosition(point);
    }
    this.addPoint(localPoint);
  };

  /**
   * finish by double clicking
   * @private
   */
  private _finishByDoubleClick = () => {
    this.finishCreate();
  };

  /**
   * key down handler
   * @private
   * @param e
   */
  private _keyDown = (e: KeyboardEvent) => {
    switch (e.key?.toLowerCase()) {
      case 'q':
        if (!this._finished) {
          e.preventDefault();
          const index = this.points.length - 1;
          this.removePoint(index);
        }
        break;
      case 'enter':
        if (!this._finished) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.finishCreate();
        }
        break;
      default:
        break;
    }
  };

  /**
   * finish create
   */
  finishCreate = () => {
    this.normalize();
    this._finish();
    this._removeListeners();
  };

  /**
   * remove all listeners
   * @private
   */
  private _removeListeners() {
    document.removeEventListener('mousemove', this._mouseMove, false);
    document.removeEventListener('mouseup', this._mouseUp, false);
    this.app.view.removeEventListener('dblclick', this._finishByDoubleClick, false);
  }

  /**
   * get label position
   */
  getLabelPosition() {
    const sorted = [...this._points].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
    return new Point(sorted[0].x, sorted[0].y);
  }

  /**
   * get shape data
   */
  getData() {
    return {
      points: this.points,
    };
  }

  /**
   * get geo json
   */
  getAreaAsGeoJSON() {
    const hitArea = this.instance.hitArea as Polygon;
    const points: [number, number][] = [];
    for (let i = 0; i < hitArea.points.length - 1; i += 2) {
      const point = [hitArea.points[i], hitArea.points[i + 1]] as [number, number];
      points.push(point);
    }
    return [[[...points]]];
  }

  /**
   * delete selected points
   */
  deleteSelectedPoints() {
    if (this.selected) {
      const deletedIndexes: number[] = [];
      this._controls.forEach((c, i) => {
        if (c.selected) {
          deletedIndexes.push(i);
          c.selected = false;
        }
      });
      if (deletedIndexes.length > 0) {
        this._points = this._points.filter((_, i) => !deletedIndexes.includes(i));
        this.normalize();
        this._changed();
        return true;
      }
    }
    return false;
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

    // points
    let nearestPoint: IPoint | undefined;
    let d: number | undefined;
    this.points.forEach((p) => {
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
    for (let i = 0; i < this._geometory.length; i += 1) {
      const [distance, segment] = this._geometory[i].distanceTo(location);
      if (distance < t) {
        const { ps, pe } = segment;
        const edgePoint = ps.equalTo(location) ? pe : ps;
        return new Point(edgePoint.x, edgePoint.y);
      }
    }

    return null;
  }

  /**
   * snap to line edges
   */
  snap(event: InteractionEvent) {
    if (event.data.originalEvent.altKey) {
      const point = event.data.getLocalPosition(this.container);
      const location = new Flatten.Point(point.x, point.y);
      for (let i = 0; i < this._geometory.length; i += 1) {
        const [distance, segment] = this._geometory[i].distanceTo(location);
        if (distance < 8 / this.scale) {
          const { ps, pe } = segment;
          const edgePoint = ps.equalTo(location) ? pe : ps;
          this._snappingPoint = new Point(edgePoint.x, edgePoint.y);
          this._snappingIndex = i;
          this.drawShape();
          return true;
        }
      }
    }

    if (this._snappingPoint) {
      this._snappingPoint = null;
      this._snappingIndex = -1;
      this.drawShape();
    }
    return false;
  }

  /**
   * add snapping point to shape
   */
  addSnappingPointToShape() {
    if (this._snappingPoint && this._snappingIndex >= 0) {
      this._points.splice(this._snappingIndex + 1, 0, { x: this._snappingPoint.x, y: this._snappingPoint.y });
      this._snappingPoint = null;
      this._snappingIndex = -1;
      this._controls.forEach((c) => {
        c.selected = false;
      });
      this.normalize();
      this._changed();
      return true;
    }
    return false;
  }

  /**
   * attach control points
   */
  attachControlPoints() {
    if (!this.editable) {
      this.removeControls();
      return;
    }

    [...this._points].forEach((point, index) => {
      if (this.selected || (this.hovered && this.showVertex)) {
        // create if never created before
        if (!this._controls[index]) {
          this._controls[index] = new ControlPoint({
            position: point,
            container: this.controlsContainer,
            scale: this.scale,
            color: this.displayBorderColor,
            cursor: Cursor.POINTER,
            onPositionChange: (x, y) => this._updateByPointPosition(index, x, y),
            onFinish: () => this._finishResize(),
            onClick: () => this._updatePointSelectedStatus(index),
          });
        }

        // update
        this._controls[index].color = this.displayBorderColor;
        this._controls[index].position = point;
        this._controls[index].add();
      } else if (this._controls[index]) {
        // remove
        this._controls[index].selected = false;
        this._controls[index].remove();
      }
    });
    if (this._controls.length > this._points.length) {
      // remove redundant control points
      this._controls.slice(this._points.length).forEach((c) => {
        c.remove();
      });
      this._controls = this._controls.slice(0, this._points.length);
    }
  }

  /**
   * update line point
   * @private
   * @param index point index
   * @param x new position x
   * @param y new position y
   */
  private _updateByPointPosition(index: number, x: number, y: number) {
    const position = this.globalSnappingPoint || new Point(x, y);
    const deltaX = position.x - this._points[index].x;
    const deltaY = position.y - this._points[index].y;
    this.updateSelectedPointsPosistion(deltaX, deltaY);
    this._resizing({ deltaX, deltaY });
  }

  /**
   * update selected points position
   * @param deltaX
   * @param deltaY
   */
  updateSelectedPointsPosistion(deltaX: number, deltaY: number) {
    // move together
    this._controls.forEach((c, i) => {
      if (c.selected) {
        const position = new Point(this._points[i].x + deltaX, this._points[i].y + deltaY);
        this._points[i].x = position.x;
        this._points[i].y = position.y;
      }
    });
    this.drawShape();
  }

  /**
   * update selected point
   * @private
   * @param index
   */
  private _updatePointSelectedStatus(index: number) {
    if (!this._controls[index].selected) {
      this._emit(EventAction.VERTEX_SELECTED, index);
      this._controls.forEach((c, i) => {
        if (i === index) {
          c.selected = true;
        } else {
          c.selected = false;
        }
      });
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
   * add a point
   * @param point
   * @param index
   */
  addPoint(point: IPoint | Point, index?: number) {
    const pIndex = index === undefined ? this._points.length : index;
    this._points.splice(pIndex, 0, { x: precise(point.x), y: precise(point.y) });
    this.drawShape();
  }

  /**
   * remove a point
   * @param index
   */
  removePoint(index: number) {
    if (index >= 0 && index < this._points.length) {
      this._points.splice(index, 1);
      this.drawShape();
    }
  }

  /**
   * normalize line shape, remove it if necessary
   */
  normalize() {
    // remove duplicated points
    const points: IPoint[] = [];
    this._points.forEach((point, index) => {
      if (index === this._points.length - 1 || point.x !== this._points[index + 1].x || point.y !== this._points[index + 1].y) {
        points.push(point);
      }
    });
    this._points = points;

    if (this._points.length < 2) {
      this._remove();
      return;
    }

    this._points.forEach((p) => {
      p.x = precise(p.x);
      p.y = precise(p.y);
    });

    this.updateGeometory();
    this.drawShape();
  }

  /**
   * update geometory
   */
  updateGeometory() {
    const linePoints = this.points;
    const lines = [];
    for (let i = 0; i < linePoints.length - 1; i += 1) {
      const start = linePoints[i];
      const end = linePoints[i + 1];
      lines.push({ start, end });
    }
    this._geometory = this._geometory.slice(0, lines.length);
    for (let i = 0; i < lines.length; i += 1) {
      const { start, end } = lines[i];
      const startPoint = new Flatten.Point(start.x, start.y);
      const endPoint = new Flatten.Point(end.x, end.y);
      if (!this._geometory[i]) {
        this._geometory[i] = new Flatten.Segment(startPoint, endPoint);
      } else {
        this._geometory[i].ps = startPoint;
        this._geometory[i].pe = endPoint;
      }
    }
  }

  /**
   * update hit area
   */
  updateHitArea() {
    const offset = 5 / this.scale;
    const areaPoints = calcOutlineForLine(this.points, offset);
    this.instance.hitArea = new Polygon(areaPoints);
  }

  /**
   * shape destroy
   */
  destroy() {
    this._removeListeners();
    document.removeEventListener('keydown', this._keyDown, false);
    // call parent
    super.destroy();
  }

  /**
   * selected points with point index & point instance
   * @returns
   */
  getSelectedPoints() {
    if (!this._finished) {
      const lastPointIndex = this._points.length - 1;
      return [{ index: lastPointIndex, point: this._points[lastPointIndex] }];
    }
    const selectedPoints: {index: number; point: IPoint}[] = [];
    const points = [...this.points];
    if (this.selected) {
      this._controls.forEach((c, i) => {
        if (c.selected) {
          selectedPoints.push({
            index: i,
            point: points[i],
          });
        }
      });
    }
    return selectedPoints;
  }

  /**
   * set selected points
   * @param pointsIndex
   */
  setSelectedPoints(pointsIndex: number[]) {
    if (this.selected) {
      this._controls.forEach((c, i) => {
        if (pointsIndex.includes(i)) {
          c.selected = true;
        } else {
          c.selected = false;
        }
      });
    }
  }

  /**
   * set points user data
   * @param pointsData
   */
  setPointsUserData(pointsData: {index: number; userData: any}[]) {
    pointsData.forEach(({ index, userData }) => {
      this._points[index].userData = cloneDeep(userData);
    });
    this.drawShape();
    if (this._finished) {
      this._changed();
    }
  }
}
