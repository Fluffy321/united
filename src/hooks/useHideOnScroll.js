import { useState, useEffect, useRef } from 'react';

// Passive window-scroll listener that returns true when the header should be hidden.
// Safe to use only on pages where scroll lives on window (not overflow containers).
export default function useHideOnScroll({ threshold = 8, minScroll = 60 } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) < threshold) return;
      setHidden(y > lastY.current && y > minScroll);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, minScroll]);

  return hidden;
}
