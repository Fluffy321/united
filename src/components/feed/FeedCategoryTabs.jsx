import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'help', label: 'Help' },
  { id: 'event', label: 'Events' },
  { id: 'job', label: 'Jobs' },
  { id: 'housing', label: 'Housing' },
  { id: 'dating', label: 'Dating' },
  { id: 'shul', label: 'Shul' },
  { id: 'news', label: 'News' },
];

export default function FeedCategoryTabs({ activeCategory, onChange }) {
  const containerRef = useRef(null);
  const dragStartX = useRef(null);

  const handlePointerDown = (e) => {
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - e.clientX;
    if (Math.abs(diff) < 40) return;
    const idx = CATEGORIES.findIndex(c => c.id === activeCategory);
    if (diff > 0 && idx < CATEGORIES.length - 1) onChange(CATEGORIES[idx + 1].id);
    if (diff < 0 && idx > 0) onChange(CATEGORIES[idx - 1].id);
    dragStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="flex gap-0 overflow-x-auto scrollbar-hide select-none border-b border-slate-100 bg-white sticky top-0 z-10"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`relative flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors ${
              isActive ? 'text-[#0F5ED7]' : 'text-slate-500'
            }`}
          >
            {cat.label}
            {isActive && (
              <motion.div
                layoutId="feedCategoryUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F5ED7] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}