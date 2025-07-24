import { useState } from 'react';

export function useForceUpdate() {
  const [status, setStatus] = useState(false);
  const update = () => setStatus(!status);
  return { status, update };
}
