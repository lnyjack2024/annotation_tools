export function drawLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color?: string,
) {
  if (color) {
    ctx.strokeStyle = color;
  }
  ctx.lineWidth = 1 * window.devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor?: string,
) {
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }
  ctx.fillRect(x, y, width, height);
}

export function drawRectBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: string,
) {
  if (color) {
    ctx.strokeStyle = color;
  }
  ctx.lineWidth = 1 * window.devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(x - 0.5, y - 0.5);
  ctx.lineTo(x + width + 0.5, y - 0.5);
  ctx.lineTo(x + width + 0.5, y + height + 0.5);
  ctx.lineTo(x - 0.5, y + height + 0.5);
  ctx.lineTo(x - 0.5, y - 0.5);
  ctx.stroke();
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4,
  fillColor?: string,
) {
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }

  const ptA = { x: x + radius, y };
  const ptB = { x: x + width, y };
  const ptC = { x: x + width, y: y + height };
  const ptD = { x, y: y + height };
  const ptE = { x, y };

  ctx.beginPath();
  ctx.moveTo(ptA.x, ptA.y);
  ctx.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, radius * window.devicePixelRatio);
  ctx.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, radius * window.devicePixelRatio);
  ctx.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, radius * window.devicePixelRatio);
  ctx.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, radius * window.devicePixelRatio);
  ctx.fill();
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor?: string,
) {
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }

  ctx.beginPath();
  ctx.arc(x, y, radius * window.devicePixelRatio, 0, 2 * Math.PI);
  ctx.fill();
}

export function drawScale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleWidth: number,
  scaleHeight: number,
  scaleHeightShort: number,
  frame: number,
  drawFollowingFrames = true,
) {
  // draw frame scale
  ctx.strokeStyle = '#767A83';
  ctx.lineWidth = 1 * window.devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(x + 0.5, y);
  ctx.lineTo(x + 0.5, y + scaleHeight);
  ctx.stroke();
  if (drawFollowingFrames) {
    // draw short scale
    ctx.strokeStyle = '#50555F';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + (i + 1) * (scaleWidth / 5) + 0.5, y);
      ctx.lineTo(x + (i + 1) * (scaleWidth / 5) + 0.5, y + scaleHeightShort);
      ctx.stroke();
    }
  }
  // draw frame number
  ctx.font = `${10 * window.devicePixelRatio}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${frame + 1}`, x + 4 * window.devicePixelRatio, y + scaleHeight);
};

export function drawRhombus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillColor?: string,
) {
  if (fillColor) {
    ctx.fillStyle = fillColor;
  }

  const halfSize = (size / 2) * window.devicePixelRatio;
  ctx.beginPath();
  ctx.moveTo(x - halfSize, y);
  ctx.lineTo(x, y - halfSize);
  ctx.lineTo(x + halfSize, y);
  ctx.lineTo(x, y + halfSize);
  ctx.lineTo(x - halfSize, y);
  ctx.fill();
};

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color?: string,
  fontSize?: number,
  maxWidth?: number,
) {
  if (color) {
    ctx.fillStyle = color;
  }
  ctx.font = `${(fontSize || 12) * window.devicePixelRatio}px Arial`;
  ctx.textBaseline = 'top';

  let newText = text;
  if (maxWidth !== undefined) {
    const { width } = ctx.measureText(text);
    if (width > maxWidth) {
      const { width: ellipsisWidth } = ctx.measureText('...');

      if (maxWidth > ellipsisWidth) {
        let len = Math.floor((maxWidth / width) * text.length);
        newText = text.substring(0, len);
        let newWidth = ctx.measureText(newText).width;
        while (newWidth > maxWidth - ellipsisWidth && len > 0) {
          len -= 1;
          newText = text.substring(0, len);
          newWidth = ctx.measureText(newText).width;
        }

        newText = `${newText}...`;
      } else {
        newText = '';
      }
    }
  }
  ctx.fillText(newText, x, y);
};
