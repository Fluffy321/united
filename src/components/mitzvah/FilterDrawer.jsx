import React, { useState } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = ['All', 'Errand', 'Quick Favor', 'Lost & Found', 'Tutoring', 'Shabbat Help', 'Other'];

export default function FilterDrawer({ open, onClose, initialFilters, onApply }) {
  const [scope, setScope] = useState(initialFilters.scope);
  const [category, setCategory] = useState(initialFilters.category);

  const handleApply = () => {
    onApply({ scope, category });
    onClose();
  };

  const handleReset = () => {
    setScope('all');
    setCategory('All');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="motion-soft-in"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 1000, backdropFilter: 'blur(2px)'
        }}
      />

      {/* Sheet */}
      <div
        className="motion-page-enter"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
          zIndex: 1001, padding: '0 16px 40px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh', overflowY: 'auto'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E2E8F0' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Filters</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Scope */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Location</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: 'near', label: '📍 Near Me' },
              { val: 'all', label: 'All' }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setScope(opt.val)}
                style={{
                  height: 36, padding: '0 16px', borderRadius: 999, border: `1.5px solid ${scope === opt.val ? '#0F172A' : '#E2E8F0'}`,
                  background: scope === opt.val ? '#0F172A' : 'white',
                  color: scope === opt.val ? 'white' : '#374151',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Category</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 999,
                  border: `1.5px solid ${category === cat ? '#0F172A' : '#E2E8F0'}`,
                  background: category === cat ? '#0F172A' : 'white',
                  color: category === cat ? 'white' : '#374151',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReset}
            style={{ flex: 1, height: 44, borderRadius: 999, border: '1.5px solid #E2E8F0', background: 'white', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            style={{ flex: 2, height: 44, borderRadius: 999, border: 'none', background: '#0F172A', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer' }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
