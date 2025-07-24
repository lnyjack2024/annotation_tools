import { Point } from 'pixi.js';
import Cursor from '../../Cursor';
import Control, { ControlOptions } from './Control';
import { computedAngle } from '../../../../utils/math';

export interface ControlRotationOptions extends ControlOptions {
  rotation: number;
  onRotationChange: (angle: number) => void;
}

/**
 * Rotation Control
 * @class
 */
export default class ControlRotation extends Control {
  /**
   * control rotation
   */
  rotation = 0;

  /**
   * when control mousedown
   */
  onRotationChange: (angle: number) => void;

  /**
   * update control point position
   * @param point
   */
  move(nowPoint:Point) {
    if (this._mousePoint) {
      const center = new Point(this.position.x, this.position.y);
      const radius = computedAngle(center, this._mousePoint, nowPoint);
      this.onRotationChange(radius);
      this._mousePoint = nowPoint;
    }
  }

  constructor({ container, position, rotation, size, scale, color, cursor, onFinish, onRotationChange }: ControlRotationOptions) {
    super({ position, container, size, scale, color, cursor: cursor || Cursor.ROTATE, onFinish });
    this.rotation = rotation;
    this.onRotationChange = onRotationChange;
  }

  /**
   * draw control
   */
  drawControl() {
    this.control.clear();
    const pivot = new Point(this.position.x, this.position.y);
    const rotationRectSize = 10 / this.scale;
    this.control.interactive = true;
    this.control.lineStyle(1 / this.scale, this.color);
    this.control.moveTo(pivot.x, pivot.y);
    this.control.lineTo(pivot.x, this.size);
    this.control.beginFill(this.color);
    this.control.drawRect(pivot.x - rotationRectSize / 2, this.size - rotationRectSize / 2, rotationRectSize, rotationRectSize);
    this.control.endFill();
    this.control.pivot.set(pivot.x, pivot.y);
    this.control.position.set(pivot.x, pivot.y);
    this.control.rotation = this.rotation;
  };
}
