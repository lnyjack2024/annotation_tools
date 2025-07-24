import { Container, DisplayObject, Graphics, Point, Rectangle } from 'pixi.js';
import polygonClipping, { Geom } from 'polygon-clipping';
import { ShapeType, ShapeData } from './types';
import ShapeGraphics from './ShapeGraphics';
import type Shape from './Shape';

export function coverTest(shape: Shape<ShapeType>, shapes: Shape<ShapeType>[]) {
  if (shapes.length <= 0) {
    return false;
  }
  const { left: cLeft, top: cTop, right: cRight, bottom: cBottom } = shape.instance.getLocalBounds();
  const shapeBounds = shapes.map((s) => s.instance.getLocalBounds());
  const intersectedBounds: Rectangle[] = [];

  // if covered by any front shape, should be selected
  const isCoveredByAnyShape = shapeBounds.some((bounds) => {
    const { left, top, right, bottom } = bounds;
    const covered = cLeft >= left && cRight <= right && cTop >= top && cBottom <= bottom;
    const intersected = cLeft <= right && cRight >= left && cTop <= bottom && cBottom >= top;
    if (intersected) {
      intersectedBounds.push(bounds);
    }
    return covered;
  });
  if (isCoveredByAnyShape) {
    return isCoveredByAnyShape;
  }

  // if covered by front shapes bounding box, should be selected
  if (intersectedBounds.length <= 0) {
    return false;
  }
  let { left, top, right, bottom } = intersectedBounds[0];
  for (let i = 1; i < intersectedBounds.length; i += 1) {
    const bounds = intersectedBounds[i];
    if (left <= bounds.right && right >= bounds.left && top <= bounds.bottom && bottom >= bounds.top) {
      left = Math.min(left, bounds.left);
      top = Math.min(top, bounds.top);
      right = Math.max(right, bounds.right);
      bottom = Math.max(bottom, bounds.bottom);
    }
  }
  return cLeft >= left && cTop >= top && cRight <= right && cBottom <= bottom;
}

export function hitTesting(point: Point, localPoint: Point, rootChildren: DisplayObject[]) {
  const allShapes: Shape<ShapeType>[] = [];
  let snappingPoint: Point | null = null;

  const getIntersections = (children: DisplayObject[]) => {
    let shapes: Shape<ShapeType>[] = [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      if (child.visible) {
        if (child instanceof ShapeGraphics) {
          if (!snappingPoint && child.shape.finished && !child.shape.resizing && !child.shape.dragging) {
            const sp = child.shape.snapToPoint(localPoint);
            if (sp) {
              snappingPoint = sp;
            }
          }
          if (child.interactive && child.shape.finished) {
            allShapes.push(child.shape);
            if (child.shape.shapeType === ShapeType.LINE) {
              if (child.hitArea.contains(localPoint.x, localPoint.y)) {
                shapes.push(child.shape);
              }
            } else if (child.containsPoint(point)) {
              shapes.push(child.shape);
            }
          }
        } else if (child instanceof Container) {
          shapes = [...shapes, ...getIntersections(child.children)];
        }
      }
    }
    return shapes;
  };

  const originalIntersections = getIntersections(rootChildren);
  const filteredIntersectionIds: string[] = [];
  let intersections: Shape<ShapeType>[] = [];
  if (originalIntersections.length > 1) {
    // filter out some shapes that cover all intersections
    for (let i = 0; i < originalIntersections.length; i += 1) {
      const curr = originalIntersections[i];
      const others = [...originalIntersections.slice(0, i), ...originalIntersections.slice(i + 1)];
      if (others.every((o) => coverTest(o, [curr]))) {
        filteredIntersectionIds.push(curr.uid);
      } else {
        intersections.push(curr);
      }
    }
  } else {
    intersections = [...originalIntersections];
  }

  intersections.sort((a, b) => {
    const abox = a.instance.getLocalBounds();
    const bbox = b.instance.getLocalBounds();
    return abox.width * abox.height - bbox.width * bbox.height;
  }); // sort by area, small shapes have higher priority

  let intersection;
  for (let i = 0; i < intersections.length; i += 1) {
    const curr = intersections[i];
    const otherIntersections = [...intersections.slice(0, i), ...intersections.slice(i + 1)];
    if (coverTest(curr, otherIntersections)) {
      // covered by other intersections
      intersection = curr;
      break;
    }
    const fronts = allShapes.filter((s) => s.order > curr.order && !filteredIntersectionIds.includes(s.uid));
    if (coverTest(curr, fronts)) {
      // covered by front shapes
      intersection = curr;
      break;
    }
  }

  return {
    intersection: intersection || intersections[0],
    snappingPoint,
  };
}

export function findIntersections(
  currentShapeData: Geom,
  currentShapeBounds: { left: number, top: number, right: number, bottom: number },
  currentShapeType: ShapeType,
  shapes: Shape<ShapeData>[],
): Shape<ShapeData>[] {
  const intersections: Shape<ShapeData>[] = [];
  for (let i = 0; i < shapes.length; i += 1) {
    const shape = shapes[i];
    const { shapeBounds } = shape;
    if (
      shapeBounds.left < currentShapeBounds.right &&
      shapeBounds.right > currentShapeBounds.left &&
      shapeBounds.top < currentShapeBounds.bottom &&
      shapeBounds.bottom > currentShapeBounds.top
    ) {
      // bbox intersects
      if (currentShapeType === ShapeType.DOT || shape.shapeType === ShapeType.DOT) {
        // one of the shapes is dot
        intersections.push(shape);
      } else {
        const shapeData = shape.getAreaAsGeoJSON();
        const intersection = polygonClipping.intersection(currentShapeData, shapeData);
        if (intersection.length > 0) {
          intersections.push(shape);
        }
      }
    }
  }
  return intersections;
}

export function precise(num: number) {
  return Math.round(num * 1000000) / 1000000;
}

export function normalizePoints(points: [number, number][]) {
  const newPoints: { x: number; y: number }[] = [];
  points.forEach((point, index) => {
    const nextPoint = points[index === points.length - 1 ? 0 : index + 1];
    const npx = precise(nextPoint[0]);
    const npy = precise(nextPoint[1]);
    const px = precise(point[0]);
    const py = precise(point[1]);
    if (px !== npx || py !== npy) {
      newPoints.push({ x: px, y: py });
    }
  });
  return newPoints;
}

export function drawVertex(graphics: Graphics, x: number, y: number, size: number) {
  graphics.drawCircle(x, y, size);
}
