import { Point, BitmapText, InteractionEvent } from 'pixi.js';
import Flatten from '@flatten-js/core';
import { cloneDeep } from 'lodash';
import polygonClipping, { Ring, Pair } from 'polygon-clipping';
import pointOnLine from '@turf/boolean-point-on-line';
import { lineString, point as turfPoint } from '@turf/helpers';
import polylabel from 'polylabel';
import Shape, { ShapeOptions, EventAction } from './Shape';
import { ShapeData, ShapeType } from './types';
import ControlPoint from './controls/ControlPoint';
import ControlRotation from './controls/ControlRotation';
import { precise, normalizePoints } from './utils';
import Cursor from '../Cursor';
import { computeRotatedPosition, computePolygonAreaCenter } from '../../../utils/math';

interface IPoint {
  x: number;
  y: number;
  userData?: any;
}

export interface PolygonData {
  points: IPoint[];
}

export interface PolygonOptions extends ShapeOptions {
  points?: IPoint[];
}

/**
 * Polygon shape
 * @class
 */
export default class Polygon extends Shape<PolygonData> {
  shapeType = ShapeType.POLYGON;

  /**
   * polygon points
   * @private
   */
  private _points: IPoint[] = [];

  /**
   * indicate next point when creating
   * @private
   */
  private _nextPoint: IPoint | null = null;

  /**
   * is mouse down
   * @private
   */
  private _isDown = false;

  /**
   * is dragging
   * @private
   */
  private _isDragging = false;

  /**
   * polygon geometory data
   */
  private _geometory = new Flatten.Polygon();

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
   * get pivot
   * @getter
   */
  get pivot() {
    const { x, y } = computePolygonAreaCenter(this.points);
    return new Point(x, y);
  }

  /**
   * shape bounds
   * @getter
   */
  get shapeBounds() {
    const shapePoints = this.points;
    const left = Math.min(...shapePoints.map((p) => p.x));
    const right = Math.max(...shapePoints.map((p) => p.x));
    const top = Math.min(...shapePoints.map((p) => p.y));
    const bottom = Math.max(...shapePoints.map((p) => p.y));
    return { left, top, right, bottom };
  }

  /**
   * shape area
   * @getter
   */
  get area() {
    return this._geometory.faces.values().next().value.area();
  }

  constructor(options: PolygonOptions) {
    super(options);

    const { points } = options;
    if (Array.isArray(points) && points.every((p) => p.x !== undefined && p.y !== undefined)) {
      this.points = points;
    }

    document.addEventListener('keydown', this._keyDown, false);
  }

  /**
   * when shape move & resize
   * @protected
   */
  protected _changed() {
    if (this.rotation !== 0) {
      this.rotatePoints();
    }
    this._emit(EventAction.CHANGED, this.getData());
  };

  /**
   * draw shape
   */
  drawShape() {
    this.instance.clear();
    this._controlLine.clear();
    this._drawShapeFill();
    this._drawShapeLine();
    this._drawShapeVertex();
    this._drawSnappingPoint();
    if (this._finished) {
      this.drawShapeLabel();
      this.attachControlPoints();
    }
  }

  /**
   * draw shape fill
   * @private
   */
  private _drawShapeFill() {
    if (this._finished) {
      this.instance.beginFill(this.color, this.alpha);
      this.instance.drawPolygon(this._points.map(({ x, y }) => new Point(x, y)));
      this.instance.endFill();
    }
  }

  /**
   * draw shape border
   * @private
   */
  private _drawShapeLine() {
    if (this._points.length === 0) return;
    const ctx = this.selected ? this._controlLine : this.instance;
    const baseWidth = 1 / this.scale;
    const color = this.displayBorderColor;
    ctx.moveTo(this._points[0].x, this._points[0].y);
    this._points.slice(1).forEach((point) => {
      ctx.lineStyle(baseWidth, color);
      ctx.drawLine(point.x, point.y, this.borderStyle, this.scale);
    });
    ctx.lineStyle(baseWidth, color);
    if (this._finished) {
      ctx.drawLine(this._points[0].x, this._points[0].y, this.borderStyle, this.scale);
    } else if (this._nextPoint) {
      ctx.drawLine(this._nextPoint.x, this._nextPoint.y, this.borderStyle, this.scale);
    }
  }

  /**
   * draw shape vertexes
   * @private
   */
  private _drawShapeVertex() {
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
    this.app.view.addEventListener('mousedown', this._mouseDown, false);
    document.addEventListener('mousemove', this._mouseMove, false);
    document.addEventListener('mouseup', this._mouseUp, false);
    this.app.view.addEventListener('dblclick', this._finishByDoubleClick, false);

    this._finished = false;
    this._nextPoint = null;
    this._isDown = true; // create start is mouse down
    this._isDragging = false;
  }

  /**
   * mouse down listener when creating
   * @private
   */
  private _mouseDown = (e: MouseEvent) => {
    if (e.button === 0) { // not right click
      this._isDown = true;
    }
  };

  /**
   * mouse move listener when creating
   * @private
   * @param event
   */
  private _mouseMove = (event: MouseEvent) => {
    if (this._isDown) {
      this._isDragging = true;
    }

    let localPoint = this.globalSnappingPoint;
    if (!localPoint) {
      const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
      localPoint = this._mapStageToLocalPosition(point);
    }
    const p = localPoint;
    if (this._isDragging) {
      // add point directly when dragging to draw a polygon
      const lastPoint = this.points[this.points.length - 1] || { x: 0, y: 0 };
      const tolerance = 10 / this.scale;
      if (Math.abs(p.x - lastPoint.x) > tolerance || Math.abs(p.y - lastPoint.y) > tolerance) {
        this.addPoint(p);
      }
      this._nextPoint = null;
    } else {
      this._nextPoint = p;
      this.drawShape();
    }
  };

  /**
   * mouse up listener when creating
   * @private
   * @param event
   */
  private _mouseUp = (event: MouseEvent) => {
    if (this._isDown && !this._isDragging) {
      let localPoint = this.globalSnappingPoint;
      if (!localPoint) {
        const point = this._mapScreenToStagePosition(event.clientX, event.clientY);
        localPoint = this._mapStageToLocalPosition(point);
      }
      const p = localPoint;
      this.addPoint(p);
    }
    this._isDown = false;
    this._isDragging = false;
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
          this.removePoint(this.points.length - 1);
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
    let otherShapeData: PolygonData[] | undefined;
    this.normalize();
    this._finish(otherShapeData);
    this._removeListeners();
  };

  /**
   * remove all listeners
   * @private
   */
  private _removeListeners() {
    this.app.view.removeEventListener('mousedown', this._mouseDown, false);
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
    return [[this.points.map((p) => [p.x, p.y] as [number, number])]];
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
    const [distance, segment] = this._geometory.distanceTo(location);
    if (distance < t) {
      const { ps, pe } = segment;
      const edgePoint = ps.equalTo(location) ? pe : ps;
      return new Point(edgePoint.x, edgePoint.y);
    }

    return null;
  }

  /**
   * snap to polygon edges
   */
  snap(event: InteractionEvent) {
    if (event.data.originalEvent.altKey) {
      const point = event.data.getLocalPosition(this.container);
      const location = new Flatten.Point(point.x, point.y);
      const [distance, segment] = this._geometory.distanceTo(location);
      if (distance < 8 / this.scale) {
        const { ps, pe } = segment;
        const edgePoint = ps.equalTo(location) ? pe : ps;
        this._snappingPoint = new Point(edgePoint.x, edgePoint.y);
        this.drawShape();
        return true;
      }
    }

    if (this._snappingPoint) {
      this._snappingPoint = null;
      this.drawShape();
    }
    return false;
  }

  /**
   * add snapping point to shape
   */
  addSnappingPointToShape() {
    if (this._snappingPoint) {
      const { point, edge, previousPointIndex } = this._findEdgeByPointPosition(this._snappingPoint);
      const x = precise(point.x);
      const y = precise(point.y);
      this._geometory.addVertex(new Flatten.Point(x, y), edge);
      this._points.splice(previousPointIndex + 1, 0, { x, y });
      this._snappingPoint = null;
      this._controls.forEach((c) => {
        c.selected = false;
      });
      this.drawShape();
      this._changed();
      return true;
    }
    return false;
  }

  /**
   * find edge for new point position
   * @param point
   */
  private _findEdgeByPointPosition({ x, y }: { x: number; y: number }) {
    const point = new Flatten.Point(x, y);
    const edge = this._geometory.findEdgeByPoint(point);
    const { start, end } = edge;
    // find the edge segment point index in points array
    let i = 0;
    while (i < this._points.length) {
      const p1 = this._points[i];
      const p2 = this._points[(i + 1) % this._points.length];
      if (
        (p1.x === start.x && p1.y === start.y && p2.x === end.x && p2.y === end.y) ||
        (p1.x === end.x && p1.y === end.y && p2.x === start.x && p2.y === start.y)
      ) {
        // if has more than one edge that has the same start-end point, just use the first found one
        // in canvas when snapping point added, just the first of the overlapped edge can be divided
        break;
      }
      i += 1;
    }
    return { point, edge, previousPointIndex: i };
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

    if (this.rotatable) {
      if (this.selected) {
        const { top, bottom } = this.shapeBounds;
        const size = this.pivot.y - Math.abs(top - bottom) / 2 - 50 / this.scale;
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
      } else if (this._rotateControl) {
        this._rotateControl.remove();
      }
    }
  }

  /**
   * update polygon point
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
   * normalize polygon shape, remove it if necessary
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

    // crossing
    if (this._points.length > 3) {
      try {
        this.splitPolygon();
      } catch (e) {
        this._remove();
        return;
      }
    }

    if (this._points.length < 3) {
      this._remove();
      return;
    }

    this._points.forEach((p) => {
      p.x = precise(p.x);
      p.y = precise(p.y);
    });

    this.updateGeometory();

    if (this.area <= 0) {
      this._remove();
      return;
    }

    this.drawShape();
  }

  // has crossing
  splitPolygon() {
    const pointsData: polygonClipping.Geom = [[this.points.map((p) => [p.x, p.y] as Pair)]];
    const intersection = polygonClipping.intersection(pointsData);
    let points: Ring = [];
    if (intersection.length > 1) {
      // crossing
      let maxArea = {
        size: 0,
        index: 0
      };
      intersection.forEach((i, index) => {
        const polygon = new Flatten.Polygon();
        polygon.addFace(i[0].map((p) => new Flatten.Point(p[0], p[1])));
        const area = polygon.faces.values().next().value.area();
        if (area > maxArea.size) {
          maxArea = {
            size: area,
            index
          };
        }
      });
      points = intersection[maxArea.index][0];
    } else if (intersection.length === 1 && intersection[0].length > 0) {
      const polygonData = lineString(intersection[0][0]);
      const allPointsOnEdge = this.points.every((p) => pointOnLine(turfPoint([p.x, p.y]), polygonData));
      if (!allPointsOnEdge) {
        // contains
        points = intersection[0][0];
      }
    }
    if (points.length > 0) {
      const setPoints: {[key: string]: number[]} = {};
      points.slice(0, points.length - 1).forEach((point) => {
        setPoints[point.join(',')] = point;
      });
      this._points = Object.values(setPoints).map((p) => ({ x: p[0], y: p[1] }));
      this.setSelectedPoints([]);
    }
  }

  /**
   * update geometory
   */
  updateGeometory() {
    this._geometory.faces.forEach((face) => this._geometory.deleteFace(face));
    this._geometory.addFace(this._points.map((p) => new Flatten.Point(p.x, p.y)));
  }

  /**
   * shape destroy
   */
  destroy() {
    document.removeEventListener('keydown', this._keyDown, false);
    this._removeListeners();
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

  static getPolygons(shapes: Shape<ShapeData>[]) {
    return shapes.filter((i) => i.shapeType === ShapeType.POLYGON) as Polygon[];
  }

  findInnerPolygons(shapes: Shape<ShapeData>[]) {
    const polygons = Polygon.getPolygons(shapes).filter((i) => i.uid !== this.uid);

    const { left, right, top, bottom } = this.shapeBounds;

    for (let i = 0; i < polygons.length; i += 1) {
      const polygon = polygons[i];
      const { left: l, right: r, top: t, bottom: b } = polygon.shapeBounds;
      if (l >= left && r <= right && t <= top && b >= bottom) {
        //
      }
    }
  }

  findIntersectPolygons(shapes: Shape<ShapeData>[], includeCover = false) {
    const polygons = Polygon.getPolygons(shapes).filter((i) => i.uid !== this.uid);
    const pointsData: polygonClipping.Geom = [[this.points.map((p) => [p.x, p.y])]];

    const intersects: string[] = [];
    for (let i = 0; i < polygons.length; i += 1) {
      const polygon = polygons[i];
      const points: polygonClipping.Geom = [[polygon.points.map((p) => [p.x, p.y])]];
      const intersection = polygonClipping.intersection(pointsData, points);
      // has crossing, check include
      if (intersection.length > 0) {
        const differenceA = polygonClipping.difference(pointsData, points);
        const differenceB = polygonClipping.difference(points, pointsData);
        if (differenceA.length > 0 && differenceB.length > 0) {
          intersects.push(polygon.uid);
        } else if (includeCover && differenceA.length > 0 && differenceB.length === 0) {
          // covered polygons
          intersects.push(polygon.uid);
        }
      }
    }

    return intersects;
  }

  merge(polygon: Polygon): PolygonData[] {
    const pointsData: polygonClipping.Geom = [[this.points.map((p) => [p.x, p.y])]];
    const polygonPoints: polygonClipping.Geom = [[polygon.points.map((p) => [p.x, p.y])]];

    const mergedPolygonPoints = polygonClipping.union(pointsData, polygonPoints);
    return (mergedPolygonPoints[0] || []).map((points) => ({
      points: normalizePoints(points),
    }));
  }

  subtract(shapes: Shape<ShapeData>[]): PolygonData[][] | null {
    const polygons = shapes.filter((i) => i.shapeType === ShapeType.POLYGON) as Polygon[];
    if (polygons.length === 0) {
      // no intersection
      return null;
    }

    const pointsData = [this.points.map((p) => [p.x, p.y] as [number, number])];
    const polygonsPointsData = polygons.map((i) => [i.points.map((p) => [p.x, p.y] as [number, number])]);

    const subtractData = polygonClipping.difference(pointsData, ...polygonsPointsData);
    const newSubtractData: {
      polygon: polygonClipping.Polygon,
      area: number,
    }[] = [];
    const addToNewSubtractData = (polygon: polygonClipping.Polygon) => {
      const newPolygon = new Flatten.Polygon(polygon[0]);
      const area = newPolygon.faces.values().next().value.area();
      newSubtractData.push({
        polygon, area,
      });
    };

    subtractData.forEach((i) => {
      if (i.length === 1) {
        // simple polygon, add directly
        addToNewSubtractData(i);
      } else if (i.length > 1) {
        // complex polygon, need split
        const points = i[0];
        const innerPolygons = i.slice(1);
        const innerPolygonCenters = innerPolygons.map((polygon) => {
          // get visual center of the polygon
          // ensure polygon contains the center point
          // otherwise, it may fail to split some concave polygons by the split line
          // ref: https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc
          const p = polylabel([polygon], 1);
          return p as [number, number];
        }).sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0])); // sort from left to right

        const sortedPoints = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
        const LPoint = sortedPoints[0];
        const RPoint = sortedPoints[sortedPoints.length - 1];
        const LPointIndex = points.findIndex((p) => p[0] === LPoint[0] && p[1] === LPoint[1]);
        const RPointIndex = points.findIndex((p) => p[0] === RPoint[0] && p[1] === RPoint[1]);

        const splitLine = [LPoint, ...innerPolygonCenters, RPoint];
        let p1: polygonClipping.Pair[];
        let p2: polygonClipping.Pair[];
        if (LPointIndex < RPointIndex) {
          p1 = [...points.slice(RPointIndex + 1), ...points.slice(0, LPointIndex), ...splitLine];
          p2 = [...points.slice(LPointIndex + 1, RPointIndex), ...splitLine.reverse()];
        } else {
          p1 = [...points.slice(RPointIndex + 1, LPointIndex), ...splitLine];
          p2 = [...points.slice(LPointIndex + 1), ...points.slice(0, RPointIndex), ...splitLine.reverse()];
        }

        const innerGeom = innerPolygons.map((p) => [p]);
        const subtractedPolygons = [
          ...polygonClipping.difference([p1], [p2], ...innerGeom),
          ...polygonClipping.difference([p2], [p1], ...innerGeom),
        ];
        subtractedPolygons.forEach((polygon) => addToNewSubtractData(polygon));
      }
    });

    return newSubtractData
      .sort((a, b) => b.area - a.area) // sort by area
      .map((i) => i.polygon.map((points) => ({
        points: normalizePoints(points),
      })));
  }

  /**
   * set actual points position
   * reset rotation
   */
  rotatePoints() {
    const points = JSON.parse(JSON.stringify(this.points)) as IPoint[];
    if (this.rotation !== 0) {
      points.forEach((p) => {
        const point = computeRotatedPosition(this.pivot, p, this.rotation);
        p.x = precise(point.x);
        p.y = precise(point.y);
      });
    }
    this._rotation = 0;
    this._updatePosition();
    this.points = points;
  }
}
