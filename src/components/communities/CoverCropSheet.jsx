import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

// Target banner ratio: 3:1 (matches CommunityHero 128px tall full-width and live preview 248×92px)
const CROP_RATIO = 3;
const OUTPUT_W = 1200;
const OUTPUT_H = OUTPUT_W / CROP_RATIO; // 400

export default function CoverCropSheet({ open, imageUrl, onSave, onCancel }) {
  const [imgNatural, setImgNatural] = useState(null);
  const [frameDims, setFrameDims] = useState(null);
  const [saving, setSaving] = useState(false);

  const frameRef = useRef(null);
  const imgRef = useRef(null);
  // pan stored in ref to avoid re-renders during drag
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const initializedRef = useRef(false);

  // Measure frame synchronously before browser paint so it's ready before image loads
  useLayoutEffect(() => {
    if (!open || !frameRef.current) return;
    const { width } = frameRef.current.getBoundingClientRect();
    if (width > 0) setFrameDims({ w: width, h: Math.round(width / CROP_RATIO) });
  }, [open]);

  // Reset state when a new image is presented
  useEffect(() => {
    if (!open || !imageUrl) return;
    panRef.current = { x: 0, y: 0 };
    initializedRef.current = false;
    setImgNatural(null);
    setSaving(false);
    if (imgRef.current) imgRef.current.style.opacity = '0';
  }, [open, imageUrl]);

  // Center image once both dimensions are known (runs once per image open)
  useEffect(() => {
    if (!imgNatural || !frameDims || initializedRef.current) return;
    initializedRef.current = true;

    const scale = Math.max(frameDims.w / imgNatural.w, frameDims.h / imgNatural.h);
    const renderW = imgNatural.w * scale;
    const renderH = imgNatural.h * scale;
    // Center within frame (clamp so image always fills frame)
    const cx = Math.min(0, Math.max(frameDims.w - renderW, (frameDims.w - renderW) / 2));
    const cy = Math.min(0, Math.max(frameDims.h - renderH, (frameDims.h - renderH) / 2));

    panRef.current = { x: cx, y: cy };

    if (imgRef.current) {
      imgRef.current.style.width = `${renderW}px`;
      imgRef.current.style.height = `${renderH}px`;
      imgRef.current.style.left = `${cx}px`;
      imgRef.current.style.top = `${cy}px`;
      imgRef.current.style.opacity = '1';
    }
  }, [imgNatural, frameDims]);

  const handleImageLoad = (e) => {
    setImgNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const clamp = (x, y) => {
    if (!imgNatural || !frameDims) return { x, y };
    const scale = Math.max(frameDims.w / imgNatural.w, frameDims.h / imgNatural.h);
    const renderW = imgNatural.w * scale;
    const renderH = imgNatural.h * scale;
    return {
      x: Math.min(0, Math.max(frameDims.w - renderW, x)),
      y: Math.min(0, Math.max(frameDims.h - renderH, y)),
    };
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panRef.current.x,
      startPanY: panRef.current.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const clamped = clamp(dragRef.current.startPanX + dx, dragRef.current.startPanY + dy);
    panRef.current = clamped;
    if (imgRef.current) {
      imgRef.current.style.left = `${clamped.x}px`;
      imgRef.current.style.top = `${clamped.y}px`;
    }
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const handleSave = async () => {
    if (!imageUrl || !imgNatural || !frameDims || saving) return;
    setSaving(true);
    try {
      const scale = Math.max(frameDims.w / imgNatural.w, frameDims.h / imgNatural.h);
      const { x: panX, y: panY } = panRef.current;
      // Source rect in natural image pixels
      const srcX = -panX / scale;
      const srcY = -panY / scale;
      const srcW = frameDims.w / scale;
      const srcH = frameDims.h / scale;

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_W, OUTPUT_H);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob);
          } else {
            setSaving(false);
          }
        },
        'image/jpeg',
        0.92,
      );
    } catch {
      setSaving(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/95">
      {/* Header bar */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[13px] font-black text-white">Adjust Cover</p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !imgNatural}
          className="flex h-9 items-center gap-1.5 rounded-full bg-blue-600 px-4 text-[13px] font-black text-white disabled:opacity-40 active:bg-blue-700 transition-colors"
        >
          {saving ? '…' : <><Check className="h-3.5 w-3.5" /> Use Cover</>}
        </button>
      </div>

      {/* Crop frame */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5">
        <div
          ref={frameRef}
          className="relative w-full overflow-hidden rounded-2xl"
          style={{
            maxWidth: 480,
            aspectRatio: `${CROP_RATIO} / 1`,
            touchAction: 'none',
            cursor: imgNatural ? 'grab' : 'default',
            background: '#111',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Cover crop"
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                position: 'absolute',
                opacity: 0,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )}

          {/* Rule-of-thirds grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.45)',
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '33.333% 33.333%',
            }}
          />

          {/* Loading spinner */}
          {!imgNatural && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </div>
          )}
        </div>

        <p className="text-center text-[12px] font-semibold text-white/35">
          Drag to reposition · 3:1 banner format
        </p>
      </div>
    </div>,
    document.body,
  );
}
