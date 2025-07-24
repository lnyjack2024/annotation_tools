import { Point, Rectangle } from 'pixi.js';
import Control, { ControlOptions } from './Control';

export type ControlBarType = 'horizonal' | 'vertical';

interface ControlBarOptions extends ControlOptions {
  type: ControlBarType;
}

/**
 * Control Point
 * @class
 */
export default class ControlBar extends Control {
  /**
   * control bar type
   * @private
   */
  private _type: ControlBarType;

  /**
   * get control bar type
   * @getter
   */
  get type() {
    return this._type;
  }

  constructor(options: ControlBarOptions) {
    super(options);
    this._type = options.type;
  }

  /**
   * draw bar control
   */
  drawControl() {
    this.control.clear();
    this._updateHitArea();
  }

  /**
   * move bar position
   * @param position
   */
  move(position: Point) {
    if (this._type === 'horizonal') {
      this.control.y = position.y;
    } else {
      this.control.x = position.x;
    }
  }

  /**
   * draw hit area
   * @private
   */
  private _updateHitArea() {
    const areaSize = 8 / this.scale;
    if (this._type === 'horizonal') {
      this.control.hitArea = new Rectangle(-this.size / 2, -areaSize / 2, this.size, areaSize);
    } else {
      this.control.hitArea = new Rectangle(-areaSize / 2, -this.size / 2, areaSize, this.size);
    }
  }
}
