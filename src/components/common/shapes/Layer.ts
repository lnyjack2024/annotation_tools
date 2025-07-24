import { Container, Point } from 'pixi.js';

export default class Layer extends Container {
  /**
   * point snapped to shape vertexes or edges
   */
  snappingPoint: Point | null = null;

  /**
   * set snapping point
   * @param point
   */
  setSnappingPoint(point: Point | null) {
    this.snappingPoint = point;
  }
}
