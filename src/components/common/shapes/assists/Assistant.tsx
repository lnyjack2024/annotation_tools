import React, { useEffect, useRef, useState } from 'react';

interface AssistantProps {
  element?: string;
  scale?: number;
  crossline?: boolean;
  measurementBox?: number[];
  mousePosition?: { x: number; y: number };
}

const Assistant = ({ element, scale = 1, crossline, measurementBox, mousePosition }: AssistantProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawn = useRef(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const draw = () => {
    if (!crossline && !measurementBox && !drawn.current) {
      return;
    }
    if (canvas.current) {
      const { width, height, left, top } = canvas.current.getBoundingClientRect();
      canvas.current.width = width * window.devicePixelRatio;
      canvas.current.height = height * window.devicePixelRatio;

      const ctx = canvas.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
        drawn.current = false;

        const p = mousePosition || position;
        const offsetX = (p.x - left) * window.devicePixelRatio;
        const offsetY = (p.y - top) * window.devicePixelRatio;

        if (crossline) {
          ctx.save();
          ctx.translate(-0.5, -0.5);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 1 * window.devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(offsetX, 0);
          ctx.lineTo(offsetX, canvas.current.height);
          ctx.moveTo(0, offsetY);
          ctx.lineTo(canvas.current.width, offsetY);
          ctx.stroke();
          ctx.restore();
          drawn.current = true;
        }

        if (measurementBox) {
          const w = measurementBox[0] * scale * window.devicePixelRatio;
          const h = measurementBox[1] * scale * window.devicePixelRatio;
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = '#5CDEF0';
          ctx.lineWidth = 1 * window.devicePixelRatio;
          ctx.moveTo(offsetX, offsetY - h / 2);
          ctx.lineTo(offsetX + w / 2, offsetY - h / 2);
          ctx.lineTo(offsetX + w / 2, offsetY);
          ctx.moveTo(offsetX - w / 2, offsetY);
          ctx.lineTo(offsetX - w / 2, offsetY + h / 2);
          ctx.lineTo(offsetX, offsetY + h / 2);
          ctx.stroke();
          ctx.restore();
          drawn.current = true;
        }
      }
    }
  };

  useEffect(() => {
    if (!mousePosition) {
      // should track mouse position by selft
      const mousemove = (e: Event) => {
        const { clientX, clientY } = e as MouseEvent;
        setPosition({ x: clientX, y: clientY });
      };
      const mouseleave = () => setPosition({ x: 0, y: 0 });
      let ele: HTMLElement | Window = window;
      if (element) {
        const node = document.querySelector<HTMLElement>(element);
        if (node) {
          ele = node;
        }
      }
      ele.addEventListener('mousemove', mousemove);
      ele.addEventListener('mouseleave', mouseleave);
      return () => {
        ele.removeEventListener('mousemove', mousemove);
        ele.removeEventListener('mouseleave', mouseleave);
      };
    }
  }, []);

  useEffect(() => {
    draw();
  }, [position, scale, crossline, measurementBox, mousePosition]);

  return (
    <canvas
      ref={canvas}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Assistant;
