import type { RectangleData, RectangleOptions } from './Rectangle';
import type { PolygonData, PolygonOptions } from './Polygon';
import type { LineData, LineOptions } from './Line';
import type { DotData, DotOptions } from './Dot';

export enum ShapeType {
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  LINE = 'line',
  DOT = 'dot',
}

export type ShapeData =
  RectangleData |
  PolygonData |
  LineData |
  DotData;

export type ShapeOptions =
  RectangleOptions |
  PolygonOptions |
  LineOptions |
  DotOptions;
