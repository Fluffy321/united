import React from 'react';

export default function MitzvahTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'requests', label: 'Help Requests' },
    { id: 'carpool', label: 'Carpool' },
    { id: 'map', label: 'Map' },
    { id: 'log', label: 'My Log' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="sticky top-[58px] z-10 bg-[#F6F8FB]/95 py-2 backdrop-blur-xl">
      <div className="mobile-page px-3">
        <div className="mobile-scroll-x flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
