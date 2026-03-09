import React, { useRef, useEffect, useCallback } from 'react';

export default function MitzvahTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'requests', label: 'Help Requests' },
    { id: 'log', label: 'My Mitzvah Log' },
    { id: 'completed', label: 'Completed Mitzvahs' }
  ];

  const barRef = useRef(null);
  const labelRefs = useRef({});
  const underlineRef = useRef(null);

  const recalc = useCallback(() => {
    const bar = barRef.current;
    const label = labelRefs.current[activeTab];
    const underline = underlineRef.current;
    if (!bar || !label || !underline) return;

    const barRect = bar.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const scrollLeft = bar.scrollLeft || 0;

    const width = labelRect.width;
    const left = (labelRect.left - barRect.left) + scrollLeft;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${left}px)`;
  }, [activeTab]);

  useEffect(() => {
    recalc();
    requestAnimationFrame(recalc);
    const t = setTimeout(recalc, 50);
    return () => clearTimeout(t);
  }, [recalc]);

  useEffect(() => {
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  return (
    <div
      ref={barRef}
      className="relative flex select-none bg-white sticky top-12 z-10 border-b border-[#E8ECF4]"
    >
      <div className="max-w-2xl mx-auto w-full px-4 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-3 text-[14px] font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span ref={(el) => { labelRefs.current[tab.id] = el; }}>
              {tab.label}
            </span>
          </button>
        ))}

        {/* Underline indicator */}
        <div
          ref={underlineRef}
          className="absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-180 ease-out"
          style={{ background: '#2563EB', width: 0, transform: 'translateX(0px)' }}
        />
      </div>
    </div>
  );
}