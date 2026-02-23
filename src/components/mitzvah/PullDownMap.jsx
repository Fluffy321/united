import React, { useState, useRef } from 'react';
import { Map as MapIcon, ChevronUp } from 'lucide-react';
import MitzvahMapView from './MitzvahMapView';

const MAP_H = Math.round(window.innerHeight * 0.42);

export default function PullDownMap({
  requests, userOrigin, mapCenter, mapZoom,
  currentUser, onSelectRequest, onHelpRequest,
  onMapStateChange
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  const toggle = (v) => {
    setOpen(v);
    // Report the bottom of the toggle button (= bottom of map area)
    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      onMapStateChange?.(v ? 'EXPANDED' : 'COLLAPSED', rect.bottom);
    } else {
      onMapStateChange?.(v ? 'EXPANDED' : 'COLLAPSED', null);
    }
  };

  return (
    <>
      {/* Map section */}
      <div
        style={{
          width: '100%',
          height: open ? MAP_H : 0,
          overflow: 'hidden',
          flexShrink: 0,
          background: '#d1d5db',
          transition: 'height 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
        id="map-panel"
      >
        {open && (
          <div style={{ width: '100%', height: MAP_H }}>
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

      {/* Toggle button — lives between map and list */}
      <button
        ref={toggleRef}
        onClick={() => toggle(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', height: 34, flexShrink: 0,
          background: 'white', border: 'none', borderBottom: '1px solid #F0F3F9',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {open ? <ChevronUp size={13} /> : <MapIcon size={13} />}
        {open ? 'Hide map' : 'Show map'}
      </button>
    </>
  );
}