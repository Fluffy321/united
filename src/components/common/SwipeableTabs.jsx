import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SwipeableTabs({ 
  tabs, 
  activeIndex, 
  onIndexChange,
  children 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setDragOffset(0);
    
    const swipeThreshold = 75;
    const swipeVelocity = 300;
    
    const shouldSwipe = Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocity;
    
    if (shouldSwipe) {
      if (info.offset.x > 0 && activeIndex > 0) {
        onIndexChange(activeIndex - 1);
      } else if (info.offset.x < 0 && activeIndex < tabs.length - 1) {
        onIndexChange(activeIndex + 1);
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Tab Content Container */}
      <motion.div
        className="flex h-full w-full"
        animate={{ 
          x: `${-activeIndex * 100}%`,
        }}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDrag={(e, info) => setDragOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
      >
        {React.Children.map(children, (child, index) => (
          <div 
            key={index}
            className="min-w-full h-full overflow-y-auto overflow-x-hidden"
            style={{ 
              pointerEvents: isDragging ? 'none' : 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Swipe Progress Indicator */}
      {isDragging && Math.abs(dragOffset) > 20 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-50"
        >
          <div className="bg-[#0F5ED7] text-white text-sm px-4 py-2 rounded-full shadow-lg font-medium">
            {dragOffset > 0 ? (
              <span>← {tabs[activeIndex - 1] || ''}</span>
            ) : (
              <span>{tabs[activeIndex + 1] || ''} →</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}