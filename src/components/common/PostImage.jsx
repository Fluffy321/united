import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * PostImage — 4:3 aspect ratio image with blur-up progressive load, rounded corners, tap-to-lightbox.
 * Props: src, alt, className, onClick
 */
export default function PostImage({ src, alt = '', className = '', onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const handleClick = (e) => {
    if (onClick) { onClick(e); return; }
    setLightbox(true);
  };

  return (
    <>
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-slate-100 cursor-pointer ${className}`}
        style={{ paddingBottom: '75%' /* 4:3 */ }}
        onClick={handleClick}
      >
        {/* Blur placeholder */}
        {!loaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 hover:scale-[1.03] ${
            loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          }`}
        />
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/8 transition-colors duration-200 rounded-xl" />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}