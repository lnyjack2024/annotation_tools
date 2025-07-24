import { useCallback, useEffect, useRef } from 'react';

const useDebounce = (callback: Function, delayTime: number) => {
  const { current } = useRef({ callback, timer: null });
  useEffect(() => {
    current.callback = callback;
  }, [callback]);

  return useCallback((...args) => {
    if (current.timer) {
      clearTimeout(current.timer);
    }

    current.timer = setTimeout(() => {
      current.callback(...args);
    }, delayTime);
  }, []);
};

export default useDebounce;
