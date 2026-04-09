import React, { useRef, useState } from 'react';
import { Archive, MailOpen } from 'lucide-react';

const SWIPE_THRESHOLD = 72;
const MAX_SWIPE = 100;

export default function SwipeableConversationItem({ children, onArchive, onMarkUnread }) {
  const startX = useRef(null);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSettling(false);
  };

  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    currentX.current = clamp(dx, -MAX_SWIPE, MAX_SWIPE);
    setOffset(currentX.current);
  };

  const handleTouchEnd = () => {
    setSettling(true);
    const dx = currentX.current;
    if (dx < -SWIPE_THRESHOLD) {
      onArchive?.();
    } else if (dx > SWIPE_THRESHOLD) {
      onMarkUnread?.();
    }
    setOffset(0);
    currentX.current = 0;
    startX.current = null;
  };

  const leftReveal = Math.max(0, offset);   // swiping right → mark unread
  const rightReveal = Math.max(0, -offset); // swiping left → archive

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Left action (mark unread) */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 rounded-2xl"
        style={{
          width: `${leftReveal}px`,
          background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
          opacity: leftReveal > 10 ? 1 : 0,
          transition: settling ? 'opacity 200ms' : 'none',
        }}
      >
        <MailOpen className="w-5 h-5 text-white flex-shrink-0" />
        {leftReveal > 50 && (
          <span className="text-white text-[11px] font-bold ml-1.5 whitespace-nowrap">Unread</span>
        )}
      </div>

      {/* Right action (archive) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 rounded-2xl"
        style={{
          width: `${rightReveal}px`,
          background: 'linear-gradient(135deg, #64748B, #475569)',
          opacity: rightReveal > 10 ? 1 : 0,
          transition: settling ? 'opacity 200ms' : 'none',
        }}
      >
        {rightReveal > 50 && (
          <span className="text-white text-[11px] font-bold mr-1.5 whitespace-nowrap">Archive</span>
        )}
        <Archive className="w-5 h-5 text-white flex-shrink-0" />
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: settling ? 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}