import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

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
    
    const swipeThreshold = 50;
    const swipeVelocity = 500;
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocity) {
      if (info.offset.x > 0 && activeIndex > 0) {
        onIndexChange(activeIndex - 1);
      } else if (info.offset.x < 0 && activeIndex < tabs.length - 1) {
        onIndexChange(activeIndex + 1);
      }
    }
  };

  return (
    <div className="relative overflow-hidden h-full">
      {/* Debug Label */}
      <div className="fixed top-2 right-2 z-50 bg-black/70 text-white text-xs px-2 py-1 rounded">
        tabIndex: {activeIndex}
      </div>

      {/* Tab Content */}
      <motion.div
        className="flex h-full"
        animate={{ x: `${-activeIndex * 100}%` }}
        transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={(e, info) => setDragOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {React.Children.map(children, (child, index) => (
          <div 
            key={index}
            className="min-w-full h-full"
            style={{ 
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Swipe Progress Indicator */}
      {isDragging && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            {dragOffset > 0 ? '← Swipe' : 'Swipe →'}
          </div>
        </div>
      )}
    </div>
  );
}