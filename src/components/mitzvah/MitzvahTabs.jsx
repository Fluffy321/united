import React from 'react';

export default function MitzvahTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'requests', label: 'Help Requests' },
    { id: 'log', label: 'My Mitzvah Log' },
    { id: 'completed', label: 'Completed Mitzvahs' }
  ];

  return (
    <div className="bg-white sticky top-0 z-10 border-b border-[#E8ECF4]">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-[14px] font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
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