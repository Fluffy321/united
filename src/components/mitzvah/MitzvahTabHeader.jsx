import React from 'react';

export default function MitzvahTabHeader({ activeTab, filters, onFilterClick, rightActionNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 15,
        background: 'white',
        borderBottom: '1px solid #F0F3F9',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        flexShrink: 0,
        pointerEvents: 'auto',
      }}
    >
      {/* Left: Status tabs */}
      <div className="flex items-center gap-2">
        {['open', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => {}} // Parent handles via activeTab prop
            className={`h-8 px-3.5 text-[12px] font-semibold rounded-full border transition-all ${
              activeTab === tab
                ? 'bg-[#0F1C2E] text-white border-[#0F1C2E]'
                : 'bg-white text-[#667085] border-[#EAECF0]'
            }`}
          >
            {tab === 'open' ? 'Needs Help' : 'Completed'}
          </button>
        ))}
        {filters.scope === 'near' && (
          <span style={{ fontSize: 11, fontWeight: 600, background: '#EEF2FF', color: '#4F46E5', borderRadius: 999, padding: '3px 10px' }}>
            📍 Near Me
          </span>
        )}
        {filters.category !== 'All' && (
          <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#374151', borderRadius: 999, padding: '3px 10px' }}>
            {filters.category}
          </span>
        )}
      </div>

      {/* Right: Action slot (Filter button or custom node) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightActionNode}
      </div>
    </div>
  );
}