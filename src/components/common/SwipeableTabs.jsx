import React, { useState, useEffect } from 'react';

// Lazy-render tabs: only mount a tab when first visited, then keep in DOM hidden.
// This prevents all pages from mounting simultaneously and firing all queries at once.
export default function SwipeableTabs({ activeIndex, onIndexChange, children }) {
  const childArray = React.Children.toArray(children);
  const [visited, setVisited] = useState(() => {
    const v = new Set();
    v.add(activeIndex);
    return v;
  });

  // Track newly visited tabs
  React.useEffect(() => {
    setVisited(prev => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      return next;
    });
  }, [activeIndex]);

  return (
    <div className="relative w-full h-full overflow-x-hidden">
      {childArray.map((child, index) => {
        if (!visited.has(index)) return null;
        return (
          <div
            key={index}
            style={{
              display: index === activeIndex ? 'block' : 'none',
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}