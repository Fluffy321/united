import React from 'react';
import { LayoutGroup, motion } from 'framer-motion';

const TABS = [
  { id: 'for_you',  label: 'For You'  },
  { id: 'trending', label: 'Trending' },
  { id: 'communities', label: 'Communities' },
  { id: 'events',   label: 'Events'   },
  { id: 'nearby',   label: 'Near You' },
  { id: 'chessed',  label: 'Chesed'   },
  { id: 'learning', label: 'Learning' },
];

export default function HomeFeedTabs({ activeTab, onChange }) {
  return (
    <LayoutGroup>
      <div className="mobile-scroll-x -mx-1 flex gap-2 px-1 py-2.5">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className={`mobile-touch relative flex-shrink-0 overflow-hidden rounded-2xl border px-4 text-[13px] font-bold whitespace-nowrap touch-manipulation ${
                isActive ? 'border-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 shadow-sm'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isActive && (
                <motion.span
                  layoutId="home-feed-active-tab"
                  className="absolute inset-0 rounded-2xl bg-blue-600"
                  transition={{ type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
