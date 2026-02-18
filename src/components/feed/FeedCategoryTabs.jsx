import React, { useRef, useState, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'event', label: 'Events' },
  { id: 'job', label: 'Jobs' },
  { id: 'help', label: 'Help' },
];

export default function FeedCategoryTabs({ activeCategory, onChange }) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const dragStartX = useRef(null);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const activeTab = tabRefs.current[activeCategory];
    const container = containerRef.current;
    if (!activeTab || !container) return;

    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const textSpan = activeTab.querySelector('span');
    const textRect = textSpan ? textSpan.getBoundingClientRect() : tabRect;

    // Use the text element's actual position relative to the container
    const left = textRect.left - containerRect.left;
    setUnderline({ left, width: textRect.width });
  }, [activeCategory]);

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
      className="relative flex border-b border-slate-100 bg-white select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            ref={(el) => { tabRefs.current[cat.id] = el; }}
            onClick={() => onChange(cat.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              isActive ? 'text-[#0F5ED7]' : 'text-slate-500'
            }`}
          >
            <span>{cat.label}</span>
          </button>
        );
      })}

      {/* Single animated underline */}
      <motion.div
        className="absolute bottom-0 h-0.5 bg-[#0F5ED7] rounded-full"
        animate={{ left: underline.left, width: underline.width }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
    </div>
  );
}