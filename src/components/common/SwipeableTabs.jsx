import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Each tab is mounted on first view and kept mounted (display:none when inactive).
// This prevents all main pages from running their effects simultaneously on load,
// which caused race conditions and broken render states.
export default function SwipeableTabs({ activeIndex, children }) {
  const [everSeen, setEverSeen] = useState(() => new Set([activeIndex]));
  const [previousIndex, setPreviousIndex] = useState(activeIndex);

  // Track which tabs have been visited so we only mount them once needed
  React.useEffect(() => {
    setPreviousIndex(activeIndex);
    setEverSeen(prev => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      return next;
    });
  }, [activeIndex]);

  const childArray = React.Children.toArray(children);
  const direction = activeIndex >= previousIndex ? 1 : -1;

  return (
    <div className="w-full" style={{ minHeight: '100dvh' }}>
      {childArray.map((child, i) => {
        if (!everSeen.has(i)) return null; // not mounted yet — no effects run
        return (
          <motion.div
            key={i}
            initial={i === activeIndex ? { opacity: 0, x: 14 * direction } : false}
            animate={i === activeIndex ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 * direction }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: i === activeIndex ? 'block' : 'none',
              minHeight: '100dvh',
              willChange: i === activeIndex ? 'opacity, transform' : 'auto',
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
