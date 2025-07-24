import { Tool } from './types';
import rectangle from './icons/rectangle.svg';
import fourDotsRectangle from './icons/four-dots-rectangle.svg';
import centerlineRectangle from './icons/centerline-rectangle.svg';
import ellipse from './icons/ellipse.svg';
import polygon from './icons/polygon.svg';
import cuboid from './icons/cuboid.svg';
import lShape from './icons/l-shape.svg';
import ocr from './icons/ocr.svg';
import ocrPolygon from './icons/ocr-polygon.svg';
import line from './icons/line.svg';
import dot from './icons/dot.svg';
import grid from './icons/grid.svg';
import recognition from './icons/recognition.svg';
import arrow from './icons/arrow.svg';
import twoSidesCuboid from './icons/two-sides-cuboid.svg';

interface ToolIconProps {
  tool: Tool;
}

const toolIcons = {
  [Tool.RECTANGLE]: rectangle,
  [Tool.FOUR_DOTS_RECTANGLE]: fourDotsRectangle,
  [Tool.CENTERLINE_RECTANGLE]: centerlineRectangle,
  [Tool.ELLIPSE]: ellipse,
  [Tool.POLYGON]: polygon,
  [Tool.CUBOID]: cuboid,
  [Tool.LSHAPE]: lShape,
  [Tool.OCR]: ocr,
  [Tool.OCR_POLYGON]: ocrPolygon,
  [Tool.LINE]: line,
  [Tool.DOT]: dot,
  [Tool.GRID]: grid,
  [Tool.RECOGNITION]: recognition,
  [Tool.ARROW]: arrow,
  [Tool.TWO_SIDES_CUBOID]: twoSidesCuboid,
};

const ToolIcon = ({ tool }: ToolIconProps) => {
  const url = toolIcons[tool];
  if (url) {
    return <img src={url} alt={tool} />;
  }
  return null;
};

export default ToolIcon;
