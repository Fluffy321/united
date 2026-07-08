import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft } from 'lucide-react';

export default function CommunityAppBar({ heroRef, community, typeConfig, isAdmin, accentHex, onBack, onManage, onShare, onOpenDrawer }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    // Observe the hero container itself (non-zero area, reliable).
    // isIntersecting = true while ANY part of hero is in viewport → keep AppBar hidden.
    // isIntersecting = false when hero is completely scrolled away → show AppBar.
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [heroRef]);

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-3 transition-opacity duration-150"
      style={{
        background: accentHex,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <button
        onClick={onBack}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <p className="font-black text-[15px] text-white tracking-tight truncate px-2 flex-1 text-center">
        {community.name}
      </p>

      <button
        onClick={onOpenDrawer}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
        style={{ background: 'rgba(255,255,255,0.2)' }}
        aria-label="Community menu"
      >
        <span className="font-black text-[18px] leading-none tracking-[2px] text-white">≡</span>
      </button>
    </div>,
    document.body
  );
}
