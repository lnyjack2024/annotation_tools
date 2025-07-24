import React from 'react';
import {
  RectangleFill,
  PolygonFill,
  LineFill,
  DotFill,
} from '../../../common/icons';
import { ShapeType } from '../../../common/shapes/types';

interface ShapeIconProps {
  shapeType?: ShapeType;
}

const ShapeIcon = ({ shapeType }: ShapeIconProps) => {
  switch (shapeType) {
    case ShapeType.RECTANGLE:
      return <RectangleFill />;
    case ShapeType.POLYGON:
      return <PolygonFill />;
    case ShapeType.LINE:
      return <LineFill />;
    case ShapeType.DOT:
      return <DotFill />;
    default:
  }
  return null;
};

export default ShapeIcon;
