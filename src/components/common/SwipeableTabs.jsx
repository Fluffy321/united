import React, { useState, useEffect } from 'react';

// Each tab is mounted on first view and kept mounted (display:none when inactive).
// This prevents all 4 pages from running their effects simultaneously on load,
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
    <div className="w-full" style={{ minHeight: '100%' }}>
      {childArray.map((child, i) => {
        if (!everSeen.has(i)) return null; // not mounted yet — no effects run
        return (
          <div
            key={i}
            style={{
              display: i === activeIndex ? 'block' : 'none',
              minHeight: '100%',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}