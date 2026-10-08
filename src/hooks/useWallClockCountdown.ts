import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

function secondsLeft(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export function useWallClockCountdown(
  endsAt: number | null,
  running: boolean,
  onFinished: () => void
): number {
  const [remaining, setRemaining] = useState(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
  }, [endsAt]);

  useLayoutEffect(() => {
    if (!running || endsAt === null) {
      setRemaining(0);
      return;
    }
    const restEndsAt = endsAt;
    function sync() {
      const left = secondsLeft(restEndsAt);
      setRemaining((current) => (current === left ? current : left));
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        onFinishedRef.current();
      }
    }
    sync();
    let frame = requestAnimationFrame(function loop() {
      sync();
      if (!finishedRef.current) {
        frame = requestAnimationFrame(loop);
      }
    });
    const appState = AppState.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame);
      appState.remove();
    };
  }, [endsAt, running]);

  return remaining;
}
