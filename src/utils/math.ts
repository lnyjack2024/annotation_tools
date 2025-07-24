/**
 * rotate point around center (based on canvas axis)
 * @param center
 * @param point
 * @param rotation
 * @returns
 */
export function computeRotatedPosition(
  center: { x: number; y: number },
  point: { x: number; y: number },
  rotation: number,
) {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const nx = cos * (point.x - center.x) + sin * (point.y - center.y) + center.x;
  const ny = -sin * (point.x - center.x) + cos * (point.y - center.y) + center.y;
  return { x: nx, y: ny };
};

/**
 * Calculate the angle of rotation
 */
export function computedAngle(
  center: { x: number; y: number },
  first: { x: number; y: number },
  second: { x: number; y: number },
) {
  if (first.x === second.x && first.y === second.y) {
    return 0;
  }
  const fcx = first.x - center.x;
  const fcy = first.y - center.y;
  const scx = second.x - center.x;
  const scy = second.y - center.y;
  const cfVector = {
    x: fcx,
    y: fcy
  };
  const csVector = {
    x: scx,
    y: scy
  };

  const angle = Math.acos((cfVector.x * csVector.x + cfVector.y * csVector.y) / (Math.sqrt(cfVector.x ** 2 + cfVector.y ** 2) * Math.sqrt(csVector.x ** 2 + csVector.y ** 2)));
  const direct = (cfVector.x * csVector.y) - (cfVector.y * csVector.x);

  return direct < 0 ? -angle : angle;
};

/**
 * calc curve length
 * @param fromX
 * @param fromY
 * @param cpX
 * @param cpY
 * @param cpX2
 * @param cpY2
 * @param toX
 * @param toY
 */
export function curveLength(
  fromX: number,
  fromY: number,
  cpX: number,
  cpY: number,
  cpX2: number,
  cpY2: number,
  toX: number,
  toY: number,
) {
  const n = 10;
  let result = 0;
  let t = 0;
  let t2 = 0;
  let t3 = 0;
  let nt = 0;
  let nt2 = 0;
  let nt3 = 0;
  let x = 0;
  let y = 0;
  let dx = 0;
  let dy = 0;
  let prevX = fromX;
  let prevY = fromY;

  for (let i = 1; i <= n; i += 1) {
    t = i / n;
    t2 = t * t;
    t3 = t2 * t;
    nt = (1 - t);
    nt2 = nt * nt;
    nt3 = nt2 * nt;

    x = (nt3 * fromX) + (3 * nt2 * t * cpX) + (3 * nt * t2 * cpX2) + (t3 * toX);
    y = (nt3 * fromY) + (3 * nt2 * t * cpY) + (3 * nt * t2 * cpY2) + (t3 * toY);
    dx = prevX - x;
    dy = prevY - y;
    prevX = x;
    prevY = y;

    result += Math.sqrt((dx * dx) + (dy * dy));
  }

  return result;
}

export function computePolygonAreaCenter(points: { x: number, y: number }[]) {
  let sumX = 0;
  let sumY = 0;
  let sumArea = 0;
  const p0 = points[0];
  for (let i = 1; i < points.length - 1; i += 1) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const area = 0.5 * ((p0.x * p1.y - p1.x * p0.y) + (p1.x * p2.y - p2.x * p1.y) + (p2.x * p0.y - p0.x * p2.y));
    sumArea += area;
    sumX += (points[0].x + p1.x + p2.x) * area;
    sumY += (points[0].y + p1.y + p2.y) * area;
  }
  const x = sumX / sumArea / 3;
  const y = sumY / sumArea / 3;
  return { x, y };
}
