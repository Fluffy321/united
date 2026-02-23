import React, { useRef, useState, useCallback } from 'react';
import MitzvahMapView from './MitzvahMapView';

const COLLAPSED_H = 0;
const EXPANDED_H = Math.round(window.innerHeight * 0.45);
const SNAP_THRESHOLD = 80; // px drag needed to snap to expanded

export default function PullDownMap({
  requests, userOrigin, mapCenter, mapZoom,
  currentUser, onSelectRequest, onHelpRequest
}) {
  const [height, setHeight] = useState(COLLAPSED_H);
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef(null);
  const dragStartHeight = useRef(COLLAPSED_H);
  const isDragging = useRef(false);

  // ---- Pointer events (mouse + touch) ----
  const onHandlePointerDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartHeight.current = height;
  }, [height]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragStart.current;
    // pulling DOWN increases height (delta > 0 when dragging down)
    const newH = Math.max(COLLAPSED_H, Math.min(EXPANDED_H, dragStartHeight.current - delta));
    setHeight(newH);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Snap
    if (height > SNAP_THRESHOLD) {
      setHeight(EXPANDED_H);
      setExpanded(true);
    } else {
      setHeight(COLLAPSED_H);
      setExpanded(false);
    }
  }, [height]);

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      {/* Draggable handle bar */}
      <div
        onMouseDown={onHandlePointerDown}
        onTouchStart={onHandlePointerDown}
        onMouseMove={onPointerMove}
        onTouchMove={onPointerMove}
        onMouseUp={onPointerUp}
        onTouchEnd={onPointerUp}
        onMouseLeave={onPointerUp}
        style={{
          width: '100%',
          height: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'ns-resize',
          background: 'white',
          borderBottom: '1px solid #F0F3F9',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 32, height: 4, borderRadius: 9999, background: '#CBD5E1' }} />
        {height < SNAP_THRESHOLD && (
          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, letterSpacing: '0.02em' }}>
            {expanded ? 'Drag up to hide map' : '↓ Pull down for map'}
          </span>
        )}
      </div>

      {/* Map panel — height animated via CSS transition */}
      <div
        style={{
          height: height,
          overflow: 'hidden',
          transition: isDragging.current ? 'none' : 'height 0.28s cubic-bezier(0.4,0,0.2,1)',
          background: '#e5e7eb',
          flexShrink: 0,
        }}
      >
        {height > 10 && (
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