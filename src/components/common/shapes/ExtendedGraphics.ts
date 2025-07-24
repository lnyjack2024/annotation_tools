import { Graphics } from 'pixi.js';
import { BorderStyle } from './Shape';
import { drawVertex } from './utils';
import { curveLength } from '../../../utils/math';

/**
 * Extended Graphics
 * @class
 */
export default class ShapeGraphics extends Graphics {
  dashLineTo(toX: number, toY: number, scale = 1, dash = 6, gap = 4) {
    const { points } = this.currentPath;
    const currentPosition = {
      x: points[points.length - 2],
      y: points[points.length - 1],
    };

    const toRight = currentPosition.x < toX;
    const toBottom = currentPosition.y < toY;

    const scaledDash = Math.max(dash / scale, dash / 2);
    const scaledGap = Math.max(gap / scale, gap / 2);
    const radian = Math.atan2(toY - currentPosition.y, toX - currentPosition.x);
    const dashX = Math.cos(radian) * scaledDash;
    const dashY = Math.sin(radian) * scaledDash;
    const gapX = Math.cos(radian) * scaledGap;
    const gapY = Math.sin(radian) * scaledGap;

    // for vertical or horizontal line, when sin(cos) = 1, cos(sin) != 0
    // add precision for these kind of cases to avoid oom
    while (
      (Math.abs(currentPosition.x - toX) > 0.00001 && (toRight ? currentPosition.x < toX : currentPosition.x > toX)) ||
      (Math.abs(currentPosition.y - toY) > 0.00001 && (toBottom ? currentPosition.y < toY : currentPosition.y > toY))
    ) {
      currentPosition.x += dashX;
      currentPosition.y += dashY;
      if (toRight ? currentPosition.x > toX : currentPosition.x < toX) {
        currentPosition.x = toX;
      }
      if (toBottom ? currentPosition.y > toY : currentPosition.y < toY) {
        currentPosition.y = toY;
      }
      this.lineTo(currentPosition.x, currentPosition.y);

      currentPosition.x += gapX;
      currentPosition.y += gapY;
      if (toRight ? currentPosition.x > toX : currentPosition.x < toX) {
        currentPosition.x = toX;
      }
      if (toBottom ? currentPosition.y > toY : currentPosition.y < toY) {
        currentPosition.y = toY;
      }
      this.moveTo(currentPosition.x, currentPosition.y);
    }
  }

  dashBezierCurveTo(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number, scale = 1, dash = 6, gap = 4) {
    const { points } = this.currentPath;
    const fromX = points[points.length - 2];
    const fromY = points[points.length - 1];

    const scaledDash = Math.max(dash / scale, dash / 2);
    const scaledGap = Math.max(gap / scale, gap / 2);

    const len = curveLength(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY);
    const groupCount = len / (scaledDash + scaledGap);
    const groupLen = len / groupCount;
    let groupIndex = 0;

    let dt = 0;
    let dt2 = 0;
    let dt3 = 0;
    let t2 = 0;
    let t3 = 0;

    for (let i = 1, j = 0; i <= len; i += 1) {
      j = i / len;

      dt = (1 - j);
      dt2 = dt * dt;
      dt3 = dt2 * dt;

      t2 = j * j;
      t3 = t2 * j;

      const px = (dt3 * fromX) + (3 * dt2 * j * cpX) + (3 * dt * t2 * cpX2) + (t3 * toX);
      const py = (dt3 * fromY) + (3 * dt2 * j * cpY) + (3 * dt * t2 * cpY2) + (t3 * toY);

      if (i <= groupIndex * groupLen + scaledDash) {
        this.lineTo(px, py);
      } else if (i < (groupIndex + 1) * groupLen) {
        this.moveTo(px, py);
      } else {
        this.moveTo(px, py);
        groupIndex += 1;
      }
    }
  }

  drawLine(toX: number, toY: number, borderStyle: BorderStyle, scale = 1) {
    if (borderStyle === BorderStyle.DASHED) {
      this.dashLineTo(toX, toY, scale);
    } else {
      this.lineTo(toX, toY);
    }
  }

  drawVertex(x: number, y: number, size: number) {
    drawVertex(this, x, y, size);
  }
}
