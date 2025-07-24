interface Point {
  x: number;
  y: number;
}

/**
 * vector based on canvas coordinates
 * @class
 */
export class Vector {
  x: number;

  y: number;

  get norm() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  get normalVector() {
    return new Vector(this.y, -this.x);
  }

  constructor(...args: [number, number] | [Point, Point]) {
    const [arg1, arg2] = args;
    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      this.x = arg1;
      this.y = arg2;
    } else if (
      arg1 && (arg1 as Point).x !== undefined && (arg1 as Point).y !== undefined &&
      arg2 && (arg2 as Point).x !== undefined && (arg2 as Point).y !== undefined
    ) {
      this.x = (arg1 as Point).x - (arg2 as Point).x;
      this.y = (arg1 as Point).y - (arg2 as Point).y;
    } else {
      throw new Error('wrong arguments');
    }
  }

  /**
   * add vector
   * @param vector
   */
  add(vector: Vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  /**
   * divide num
   * @param num
   */
  divide(num: number) {
    this.x /= num;
    this.y /= num;
    return this;
  }

  /**
   * normalize norm to base
   * @param base
   */
  normalize(base = 1) {
    const a = base / this.norm;
    this.x *= a;
    this.y *= a;
    return this;
  }

  /**
   * dot of another vector
   * @param vector
   */
  dot(vector: Vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  /**
   * clone a new vector
   * @returns
   */
  clone() {
    return new Vector(this.x, this.y);
  }
}

export function calcOutlineForLine(points: Point[], width: number) {
  const list1: Point[] = [];
  const list2: Point[] = [];

  let lastSegVector: Vector | undefined;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const vector = new Vector(p1, p2).normalVector.normalize(width);

    // first point
    if (i === 0) {
      list1.push({
        x: p1.x + vector.x,
        y: p1.y + vector.y,
      });
      list2.unshift({
        x: p1.x - vector.x,
        y: p1.y - vector.y,
      });
    }

    // points between first & last
    if (lastSegVector) {
      const pointVector = vector.clone().add(lastSegVector);
      const dot = vector.dot(pointVector) + 1; // add 1 to fix cos = 0 issue
      const cos = dot / (vector.norm * pointVector.norm);
      const dis = width / cos;
      const actualVector = pointVector.normalize(dis);
      list1.push({
        x: p1.x + actualVector.x,
        y: p1.y + actualVector.y,
      });
      list2.unshift({
        x: p1.x - actualVector.x,
        y: p1.y - actualVector.y,
      });
    }
    lastSegVector = vector;

    // last point
    if (i === points.length - 2) {
      list1.push({
        x: p2.x + vector.x,
        y: p2.y + vector.y,
      });
      list2.unshift({
        x: p2.x - vector.x,
        y: p2.y - vector.y,
      });
    }
  }

  return list1.concat(list2);
}
