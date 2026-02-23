import React from 'react';

// Tap-only tabs — no swipe gestures to avoid conflicts with scrollable lists and maps.
export default function SwipeableTabs({ activeIndex, onIndexChange, children }) {
  const childArray = React.Children.toArray(children);
  return (
    <div className="relative w-full h-full overflow-hidden">
      {childArray.map((child, index) => (
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
      ))}
    </div>
  );
}