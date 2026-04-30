import { useEffect, useRef, useState } from 'react';

/**
 * Count up to `target` over `duration` ms using ease-out-cubic.
 */
export function useCountUp(target, { duration = 800 } = {}) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof target !== 'number' || target <= 0) {
      setValue(target || 0);
      return undefined;
    }
    startRef.current = performance.now();
    setValue(0);

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
