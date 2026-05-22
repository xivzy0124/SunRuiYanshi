import { useState, useEffect } from 'react';

export default function useCountUp(target, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf;
    const timeout = setTimeout(() => {
      if (target === 0) {
        setValue(0);
        return;
      }

      let start;
      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          raf = requestAnimationFrame(animate);
        }
      };
      raf = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
