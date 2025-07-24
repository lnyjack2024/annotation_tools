import { setStyle } from '../../../../utils';

interface ScrollOptions {
  container: HTMLElement;
  height?: number;
  barColor?: string;
  trackStyle?: {[key: string]: any};
  displayRange?: { start: number; end: number; };
  onScroll: (start: number, end: number) => void;
}

export default class ScrollControl {
  container: HTMLElement;

  displayRange: {start: number; end: number;} = { start: 0, end: 1 };

  scrollTrack: HTMLElement;

  trackStyle?: {[key: string]: any};

  scrollBar: HTMLElement;

  params: {
    height: number;
    barColor: string;
    trackColor: string;
  };

  isDragging = false;

  startX = 0;

  stop: any;

  onScroll: (start: number, end: number) => void;

  constructor({ container, height, barColor, trackStyle, displayRange, onScroll }: ScrollOptions) {
    this.container = container;
    this.params = {
      height: height || 20,
      barColor: barColor || '#777B82',
      trackColor: trackStyle?.color || '#eee',
    };
    if (displayRange) {
      this.displayRange = displayRange;
    }
    this.trackStyle = trackStyle;
    this.scrollTrack = document.createElement('div');
    this.scrollBar = document.createElement('div');
    this.onScroll = onScroll;
    this.init();
  }

  init() {
    const { height, barColor, trackColor } = this.params;
    this.scrollTrack.className = 'wave-scroll';
    setStyle(this.scrollTrack, {
      position: 'relative',
      width: '100%',
      height: `${height}px`,
      padding: '2px 0',
      backgroundColor: trackColor,
      borderRadius: '2px',
      overflow: 'hidden',
      ...this.trackStyle
    });
    this.scrollBar.className = 'wave-scroll-bar';
    setStyle(this.scrollBar, {
      position: 'absolute',
      width: '100%',
      minWidth: '20px',
      height: `${height - 4}px`,
      backgroundColor: barColor,
      borderRadius: '2px',
      cursor: 'pointer',
    });

    this.scrollTrack.appendChild(this.scrollBar);
    this.container.appendChild(this.scrollTrack);
    this.listen();
    this.resize();
  }

  resize() {
    if (this.scrollTrack && this.scrollBar) {
      const { clientWidth } = this.scrollTrack;
      const { start, end } = this.displayRange;
      const precent = end - start;
      let barWidth = precent * clientWidth;
      barWidth = Math.max(barWidth, 20);
      const left = start ? (start / (1 - precent)) * (clientWidth - barWidth) : 0;
      setStyle(this.scrollBar, {
        width: `${(barWidth / clientWidth) * 100}%`,
        left: `${left}px`
      });
    }
  }

  setScroll(displayRange: { start: number; end: number }) {
    this.displayRange = displayRange;
    this.resize();
  }

  listen() {
    this.scrollBar.addEventListener('mousedown', this.mouseDown);
    window.addEventListener('mousemove', this.mouseMove);
    window.addEventListener('mouseup', this.mouseLeave);
  }

  destory() {
    this.scrollBar.removeEventListener('mousedown', this.mouseDown);
    window.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('mouseup', this.mouseLeave);
  }

  mouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.startX = e.clientX;
  };

  mouseLeave = () => {
    if (this.isDragging) {
      this.isDragging = false;
    }
  };

  mouseMove = (e: MouseEvent) => {
    const { start, end } = this.displayRange;
    const precent = end - start;
    if (this.isDragging && precent < 1) {
      const movePrecent = ((e.clientX - this.startX) * (1 - precent)) / (this.scrollTrack.clientWidth - this.scrollBar.clientWidth);
      let left = movePrecent + start;
      if (left < 0) {
        left = 0;
      } else if (left + precent > 1) {
        left = 1 - precent;
      }
      this.displayRange = {
        start: left,
        end: left + precent,
      };
      this.startX = e.clientX;
      this.onScroll(left, left + precent);
      this.resize();
    }
  };
}
