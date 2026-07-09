import React from 'react';
import { WORKFLOW_TABS } from './shared';

export default function MitzvahWorkflowTabsBar({ activeView, onChangeView }) {
  return (
    <div className="sticky top-0 z-20 -mx-3 mt-3 bg-[#F6F8FB]/78 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
      <div className="surface-panel-soft rounded-[20px] p-1.5">
        <div className="mobile-scroll-x flex gap-2">
          {WORKFLOW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChangeView(tab.id)}
              className={`motion-press shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-black transition ${
                activeView === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
