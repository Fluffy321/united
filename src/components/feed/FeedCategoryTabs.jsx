import React, { useRef, useEffect, useCallback } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'event', label: 'Events' },
  { id: 'job', label: 'Jobs' },
  { id: 'help', label: 'Help' },
];

export default function FeedCategoryTabs({ activeCategory, onChange }) {
  const barRef = useRef(null);
  const labelRefs = useRef({});
  const underlineRef = useRef(null);
  const dragStartX = useRef(null);

  const recalc = useCallback(() => {
    const bar = barRef.current;
    const label = labelRefs.current[activeCategory];
    const underline = underlineRef.current;
    if (!bar || !label || !underline) return;

    const barRect = bar.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const scrollLeft = bar.scrollLeft || 0;

    const width = labelRect.width;
    const left = (labelRect.left - barRect.left) + scrollLeft;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${left}px)`;
  }, [activeCategory]);

  useEffect(() => {
    // Immediate + after paint + after fonts settle
    recalc();
    requestAnimationFrame(recalc);
    const t = setTimeout(recalc, 50);
    return () => clearTimeout(t);
  }, [recalc]);

  useEffect(() => {
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  const handlePointerDown = (e) => { dragStartX.current = e.clientX; };
  const handlePointerUp = (e) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - e.clientX;
    if (Math.abs(diff) < 40) { dragStartX.current = null; return; }
    const idx = CATEGORIES.findIndex(c => c.id === activeCategory);
    if (diff > 0 && idx < CATEGORIES.length - 1) onChange(CATEGORIES[idx + 1].id);
    if (diff < 0 && idx > 0) onChange(CATEGORIES[idx - 1].id);
    dragStartX.current = null;
  };

  return (
    <div
      ref={barRef}
      className="relative flex border-b border-slate-100 bg-white select-none overflow-x-auto scrollbar-hide"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors whitespace-nowrap px-4 ${
              isActive ? 'text-[#0F5ED7]' : 'text-slate-500'
            }`}
          >
            <span ref={(el) => { labelRefs.current[cat.id] = el; }}>
              {cat.label}
            </span>
          </button>
        );
      })}

      {/* Underline — positioned via transform for smoothness */}
      <div
        ref={underlineRef}
        className="absolute bottom-0 left-0 h-0.5 bg-[#0F5ED7] rounded-full transition-all duration-200 ease-out"
        style={{ width: 0, transform: 'translateX(0px)' }}
      />
    </div>
  );
}