export const IS_BROWSER =
  (typeof window === 'undefined' ? 'undefined' : typeof window) === 'object';

export const DEFAULT_ELEMENT = IS_BROWSER ? document : {};

export const DEFAULT_EVENTS = [
  'mousemove',
  'keydown',
  'wheel',
  'DOMMouseScroll',
  'mousewheel',
  'mousedown',
];
