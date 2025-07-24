import { Container, Graphics, Point, InteractionEvent } from 'pixi.js';
import Cursor from '../../Cursor';

export interface ControlOptions {
  position: {
    x: number;
    y: number;
  };
  container: Container;
  scale?: number;
  size?: number;
  color?: number;
  cursor?: Cursor;
  onPositionChange?: (x: number, y: number, event: InteractionEvent) => void;
  onFinish?: () => void;
  onClick?: () => void;
}

/**
 * Control base
 * @class
 */
export default abstract class Control {
  /**
   * control instance
   * @member {PIXI.Graphics}
   */
  control = new Graphics();

  /**
   * control
   */
  cursor = Cursor.DEFAULT;

  /**
   * control container
   * @member {PIXI.Container}
   */
  container: Container;

  /**
   * control color
   * @private {number}
   */
  private _color = 0xFFFF00;

  /**
   * scale factor
   * @private {number}
   */
  private _scale = 1;

  /**
   * control size
   * @private {number}
   */
  private _size = 4;

  /**
   * is selected
   * @private {boolean}
   */
  private _selected = false;

  /**
   * control position when mouse down
   * @private {PIXI.Point}
   */
  private _downPoint: Point | null = null;

  /**
   * control position when mouse down
   * @private {PIXI.Point}
   */
  protected _mousePoint: Point | null = null;

  /**
   * is control dragged
   * @private {boolean}
   */
  private _dragged = false;

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
      this.drawControl();
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
    if (shouldUpdate) {
      this.drawControl();
    }
  }

  /**
   * get size
   * @getter
   */
  get size() {
    return this._size;
  }

  /**
   * set size
   * @setter
   */
  set size(size: number) {
    const shouldUpdate = this._size !== size;
    this._size = size;
    if (shouldUpdate) {
      this.drawControl();
    }
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
    if (shouldUpdate) {
      this.drawControl();
    }
  }

  /**
   * get position
   * @getter
   */
  get position() {
    return {
      x: this.control.x,
      y: this.control.y,
    };
  }

  /**
   * set position
   * @setter
   */
  set position({ x, y }: { x: number; y: number; }) {
    this.control.x = x;
    this.control.y = y;
  }

  /**
   * when control posistion change
   */
  onPositionChange?: (x: number, y: number, event: InteractionEvent) => void;

  /**
   * when control dragging ends
   */
  onFinish?: () => void;

  /**
   * when control is clicked
   */
  onClick?: () => void;

  constructor({ position, container, scale, size, color, cursor, onPositionChange, onFinish, onClick }: ControlOptions) {
    // setup
    this.container = container;
    this.scale = scale || this.container.scale.x;
    if (size !== undefined) {
      this._size = size;
    }
    if (color !== undefined) {
      this._color = color;
    }
    this.onPositionChange = onPositionChange;
    this.onFinish = onFinish;
    this.onClick = onClick;
    this.control.x = position.x;
    this.control.y = position.y;
    this.control.interactive = true;
    // FIXME: use 9999 as max z-index
    this.control.zIndex = 9999;
    // setup control listeners
    this.control.on('pointerdown', this._handlePointerDown);
    this.control.on('pointerup', this._handlePointerUp);
    this.control.on('pointerupoutside', this._handlePointerUp);
    this.control.on('pointermove', this._handlePointerMove);
    if (cursor) {
      this.cursor = cursor;
      this.control.on('pointerover', () => {
        this.control.cursor = this.cursor;
      });
      this.control.on('pointerout', () => {
        this.control.cursor = Cursor.DEFAULT;
      });
    }
    this.container.addChild(this.control);
  }

  /**
   * draw control
   */
  abstract drawControl(): void;

  /**
   * move control
   * @param point new position
   */
  abstract move(point: Point): void;

  /**
   * add and redraw
   */
  add() {
    this.container.addChild(this.control);
    this.drawControl();
  }

  /**
   * remove
   */
  remove() {
    this.container.removeChild(this.control);
  }

  /**
   * destroy
   */
  destroy() {
    this.container.removeChild(this.control);
    this.control.destroy({
      children: true,
      texture: true,
      baseTexture: true,
    });
  }

  /**
   * control pointer down
   * @private
   * @param event
   */
  private _handlePointerDown = (event: InteractionEvent) => {
    event.stopPropagation();
    this._dragged = false;
    const point = event.data.getLocalPosition(this.container);
    this._mousePoint = point;
    this._downPoint = new Point(this.control.x, this.control.y);
    if (this.onClick) {
      this.onClick();
    }
  };

  /**
   * control pointer move
   * @private
   * @param event
   */
  private _handlePointerMove = (event: InteractionEvent) => {
    if (this._downPoint || this._mousePoint) {
      this._dragged = true;
      const point = event.data.getLocalPosition(this.container);
      this.move(point);
      if (this.onPositionChange) {
        this.onPositionChange(this.control.x, this.control.y, event);
      }
    }
  };

  /**
   * control pointer up
   * @private
   * @param event
   */
  private _handlePointerUp = (event: InteractionEvent) => {
    this._downPoint = null;
    this._mousePoint = null;
    if (this._dragged) {
      if (this.onPositionChange) {
        this.onPositionChange(this.control.x, this.control.y, event);
      }
      if (this.onFinish) {
        this.onFinish();
      }
      this._dragged = false;
    }
  };
}
