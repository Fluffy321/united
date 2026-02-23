import React, { useState } from 'react';
import { Map as MapIcon, ChevronUp } from 'lucide-react';
import MitzvahMapView from './MitzvahMapView';

const EXPANDED_H = Math.round(window.innerHeight * 0.45);

export default function PullDownMap({
  requests, userOrigin, mapCenter, mapZoom,
  currentUser, onSelectRequest, onHelpRequest
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', height: 36,
          background: 'white', border: 'none', borderBottom: '1px solid #F0F3F9',
          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {open ? <ChevronUp size={14} color="#6B7280" /> : <MapIcon size={14} color="#6B7280" />}
        {open ? 'Hide map' : 'Show map'}
      </button>

      {/* Map panel — height animated via CSS */}
      <div
        style={{
          height: open ? EXPANDED_H : 0,
          overflow: 'hidden',
          transition: 'height 0.28s cubic-bezier(0.4,0,0.2,1)',
          background: '#e5e7eb',
          flexShrink: 0,
        }}
      >
        {open && (
          <div style={{ width: '100%', height: EXPANDED_H }}>
            <MitzvahMapView
              key={`${mapCenter?.lat}-${mapCenter?.lng}`}
              requests={requests}
              userOrigin={userOrigin}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              currentUser={currentUser}
              onSelectRequest={onSelectRequest}
              onHelpRequest={onHelpRequest}
              filters={{}}
            />
          </div>
        )}
      </div>
    </div>
  );
}