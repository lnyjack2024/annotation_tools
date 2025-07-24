import { useRef } from 'react';

export function usePrevious<T = any>(value: T) {
  const cur = useRef(value);
  const pre = useRef(value);

  if (cur.current !== value) {
    pre.current = cur.current;
    cur.current = value;
  }

  return pre.current;
}
