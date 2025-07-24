import ExtendedGraphics from './ExtendedGraphics';
import type Shape from './Shape';

/**
 * Extended Graphics, with shape instance
 * @class
 */
export default class ShapeGraphics<T> extends ExtendedGraphics {
  /**
   * shape instance
   * @member {Shape}
   */
  shape: Shape<T>;

  constructor(shape: Shape<T>) {
    super();
    this.shape = shape;
  }
}
