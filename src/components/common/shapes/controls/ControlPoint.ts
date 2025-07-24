import { Point, Circle } from 'pixi.js';
import Control, { ControlOptions } from './Control';
import { drawVertex } from '../utils';

/**
 * Control Point
 * @class
 */
export default class ControlPoint extends Control {
  /**
   * set scale
   * @setter
   */
  set scale(scale: number) {
    this.control.scale.set(1 / scale, 1 / scale);
  }

  constructor(options: ControlOptions) {
    super(options);

    this.control.hitArea = new Circle(0, 0, this.size * 3);
  }

  /**
   * draw point control
   */
  drawControl() {
    this.control.clear();
    this.control.lineStyle(1, this.color);
    this.control.beginFill(this.selected ? this.color : 0x222222);
    drawVertex(this.control, 0, 0, this.size);
    this.control.endFill();
  }

  /**
   * update control point position
   * @param point
   */
  move(point: Point) {
    this.control.x = point.x;
    this.control.y = point.y;
  }
}
