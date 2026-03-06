import React, { useRef, useEffect, useCallback } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'help', label: 'Help' },
  { id: 'event', label: 'Events' },
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
      className="relative flex bg-white select-none overflow-x-auto scrollbar-hide"
      style={{ borderBottom: '1px solid #EAECF0' }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex-shrink-0 py-2.5 text-[13px] font-semibold transition-colors whitespace-nowrap px-4 ${
              isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'
            }`}
          >
            <span ref={(el) => { labelRefs.current[cat.id] = el; }}>
              {cat.label}
            </span>
          </button>
        );
      })}

      {/* Underline indicator */}
      <div
        ref={underlineRef}
        className="absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-180 ease-out"
        style={{ background: 'var(--accent)' }}
        style={{ width: 0, transform: 'translateX(0px)' }}
      />
    </div>
  );
}