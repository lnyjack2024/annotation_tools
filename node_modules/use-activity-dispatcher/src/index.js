import { useEffect } from 'react';

import { DEFAULT_ELEMENT, DEFAULT_EVENTS, IS_BROWSER } from './utils';

const handleEvent = e => {
  window.parent.postMessage(`iframe-${e.type}`, '*');
};

export function useActivityDispatcher({
  events = DEFAULT_EVENTS,
  element = DEFAULT_ELEMENT,
  capture = true,
  passive = true,
} = {}) {
  const _bindEvents = () => {
    if (!IS_BROWSER) {
      return;
    }

    events.forEach(e => {
      element.addEventListener(e, handleEvent, {
        capture,
        passive,
      });
    });
  };

  const _unbindEvents = (force = false) => {
    if (!IS_BROWSER) {
      return;
    }

    events.forEach(e => {
      element.removeEventListener(e, handleEvent, {
        capture,
        passive,
      });
    });
  };

  useEffect(() => {
    if (window.parent) {
      _bindEvents();
    }

    return () => {
      _unbindEvents();
    };
  }, []);
}
