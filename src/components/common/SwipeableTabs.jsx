import React from 'react';

export default function SwipeableTabs({ activeIndex, children }) {
  const childArray = React.Children.toArray(children);
  const activeChild = childArray[activeIndex];
  return (
    <div className="w-full" style={{ minHeight: '100%' }}>
      {activeChild}
    </div>
  );
}