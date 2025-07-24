import { useCallback, useState } from 'react';
import useInterval from '@/hooks/useInterval';

export interface Options {
  interval?: number;
  onEnd?: () => void;
  autoStart?: boolean;
}

interface Action {
  startCountdown: () => void;
}

const useCountdown = (
  countdown: number,
  options: Options,
): [timeLeft: number, action: Action] => {
  const { interval = 1000, onEnd, autoStart = true } = options;
  const [timeLeft, setTimeLeft] = useState(autoStart ? countdown : 0);
  const [intervalTime, setIntervalTime] = useState(autoStart ? interval : null);

  useInterval(() => {
    const targetLeft = timeLeft - 1;
    setTimeLeft(targetLeft);
    if (targetLeft === 0) {
      setIntervalTime(null);
      onEnd?.();
    }
  }, intervalTime);

  const startCountdown = useCallback(() => {
    setTimeLeft(countdown);
    setIntervalTime(interval);
  }, [countdown, interval]);

  return [timeLeft, { startCountdown }];
};

export default useCountdown;
