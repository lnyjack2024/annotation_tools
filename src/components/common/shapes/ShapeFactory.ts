import type Shape from './Shape';
import Rectangle from './Rectangle';
import Polygon from './Polygon';
import Line from './Line';
import Dot from './Dot';
import { ShapeType, ShapeData, ShapeOptions } from './types';

export default class ShapeFactory {
  static getShape(shapeType: ShapeType, options: ShapeOptions): Shape<ShapeData> | null {
    switch (shapeType) {
      case ShapeType.RECTANGLE:
        return new Rectangle(options);
      case ShapeType.POLYGON:
        return new Polygon(options);
      case ShapeType.LINE:
        return new Line(options);
      case ShapeType.DOT:
        return new Dot(options);
      default:
    }
    return null;
  }
}
