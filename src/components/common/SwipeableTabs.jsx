import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Each tab is mounted on first view and kept mounted (display:none when inactive).
// This prevents all main pages from running their effects simultaneously on load,
// which caused race conditions and broken render states.
export default function SwipeableTabs({ activeIndex, children }) {
  const [everSeen, setEverSeen] = useState(() => new Set([activeIndex]));

  // Track which tabs have been visited so we only mount them once needed
  React.useEffect(() => {
    setEverSeen(prev => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      return next;
    });
  }, [activeIndex]);

  const childArray = React.Children.toArray(children);

  return (
    <div className="w-full" style={{ minHeight: '100dvh' }}>
      {childArray.map((child, i) => {
        if (!everSeen.has(i)) return null; // not mounted yet — no effects run
        return (
          <motion.div
            key={i}
            initial={false}
            animate={i === activeIndex ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
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
