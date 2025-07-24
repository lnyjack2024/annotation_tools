import { EventEmitter } from 'eventemitter3';
import { Container, Texture, Sprite, InteractionEvent } from 'pixi.js';
import Cursor from '../../Cursor';

export enum EventAction {
  SELECTED = 'selected',
  POINTER_OVER = 'pointer-over',
  POINTER_OUT = 'pointer-out',
}

export interface AnchorOptions {
  container: Container;
  scale?: number;
  interactive?: boolean;
  x: number;
  y: number;
  img: string;
  selectedImg: string;
}

/**
 * anchor
 * @class
 */
export default class Anchor extends EventEmitter {
  /**
   * container
   */
  container: Container;

  /**
   * anchor x
   */
  x: number;

  /**
   * anchor y
   */
  y: number;

  /**
   * anchor image
   */
  img = new Sprite();

  /**
   * anchor default style
   */
  texture?: Texture;

  /**
   * anchor selected style
   */
  selectedTexture?: Texture;

  /**
   * custom data
   * @member {any}
   */
  data: any;

  /**
   * is anchor destroyed
   */
  destroyed = false;

  /**
   * view scale
   */
  private _viewScale = 1;

  /**
   * is selected
   */
  private _selected = false;

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
    if (this.destroyed) {
      return;
    }
    const shouldUpdate = this._selected !== selected;
    this._selected = selected;
    const index = this.container.getChildIndex(this.img);
    const count = this.container.children.length;
    if (index !== count - 1) {
      this.container.addChildAt(this.img, count - 1); // move to front
    }
    if (shouldUpdate && this.selectedTexture && this.texture) {
      this.img.texture = selected ? this.selectedTexture : this.texture;
    }
  }

  /**
   * get visible
   * @getter
   */
  get visible() {
    return this.img.visible;
  }

  /**
   * set visible
   * @setter
   */
  set visible(visible: boolean) {
    this.img.visible = visible;
  }

  /**
   * get interactive
   * @getter
   */
  get interactive() {
    return this.img.interactive;
  }

  /**
   * set interactive
   * @setter
   */
  set interactive(interactive: boolean) {
    this.img.interactive = interactive;
  }

  constructor({ container, scale, interactive = true, x, y, img, selectedImg }: AnchorOptions) {
    super();

    this.container = container;
    if (scale !== undefined) {
      this._viewScale = scale;
    }
    this.interactive = interactive;

    this.x = x;
    this.y = y;
    this.img.zIndex = 10000;
    this.container.addChild(this.img);

    // add listeners
    this.img.on('pointerover', this._processPointerOver);
    this.img.on('pointerout', this._processPointerOut);
    this.img.on('pointerdown', this._processPointerDown);

    this.setImage(img, selectedImg);
  }

  /**
   * set anchor texture
   * @param texture
   */
  setTexture(texture?: Texture) {
    if (texture) {
      this.img.texture = texture;
      // update position
      this.setPosition(this.x, this.y);
      // update scale
      this.setScale(this._viewScale);
    }
  }

  /**
   * set anchor position
   * @param x
   * @param y
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    const { width, height } = this.img;
    this.img.position.set(x - width / 2, y - height); // target to the center botoom anchor
  }

  /**
   * set anchor scale
   * @param viewScale
   */
  setScale(viewScale: number) {
    this._viewScale = viewScale;
    this.img.scale.set(1 / this._viewScale);
    this.setPosition(this.x, this.y);
  }

  /**
   * set image
   * @param img
   * @param selectedImg
   */
  setImage(img: string, selectedImg: string) {
    Promise.all([
      Texture.fromURL(img),
      Texture.fromURL(selectedImg),
    ]).then((resources) => {
      if (!this.destroyed) {
        this.texture = resources[0];
        this.selectedTexture = resources[1];
        this.setTexture(this.selected ? this.selectedTexture : this.texture);
      }
    });
  }

  /**
   * destroy
   */
  destroy() {
    Object.values(EventAction).forEach((action) => {
      this.off(action);
    });
    this.container.removeChild(this.img);
    this.img.destroy();
    // remove data
    if (this.data) {
      this.data = undefined;
    }
    this.destroyed = true;
  }

  /**
   * process pointer over
   */
  private _processPointerOver = () => {
    this.img.cursor = Cursor.POINTER;
    this.emit(EventAction.POINTER_OVER, this);
  };

  /**
   * process pointer out
   */
  private _processPointerOut = () => {
    this.img.cursor = Cursor.DEFAULT;
    this.emit(EventAction.POINTER_OUT, this);
  };

  /**
   * process pointer down
   * @param event
   */
  private _processPointerDown = (event: InteractionEvent) => {
    if (event.data.button === 2) {
      return;
    }

    event.stopPropagation();
    this.selected = true;
    this.emit(EventAction.SELECTED, this);
  };
}
