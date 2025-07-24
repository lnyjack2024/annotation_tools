import { SyntheticEvent, useState } from 'react';

export function useToggle(initialValue = false) {
  const [visible, setVisible] = useState<boolean>(initialValue);

  function toggle(status?: boolean | SyntheticEvent<HTMLElement>) {
    const newStatus = typeof status === 'boolean' ? status : !visible;
    setVisible(newStatus);
  }
  return { visible, toggle };
}
