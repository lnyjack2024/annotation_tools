import React from 'react';
import {
  Rectangle,
  Polygon,
  Line,
  Dot,
} from '../../../common/icons';
import { Tool } from '../../types';

interface ToolIconProps {
  tool: Tool;
}

const ToolIcon = ({ tool }: ToolIconProps) => {
  switch (tool) {
    case Tool.RECTANGLE:
      return <Rectangle />;
    case Tool.POLYGON:
      return <Polygon />;
    case Tool.LINE:
      return <Line />;
    case Tool.DOT:
      return <Dot />;
    default:
  }
  return null;
};

export default ToolIcon;
