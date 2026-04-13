import React from 'react';

export default function SwipeableTabs({ activeIndex, children }) {
  const childArray = React.Children.toArray(children);
  return (
    <div className="w-full" style={{ minHeight: '100%' }}>
      {childArray.map((child, i) => (
        <div
          key={i}
          style={{
            display: i === activeIndex ? 'block' : 'none',
            minHeight: '100%',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}