import React from 'react';

export default function AppSplashScreen({ exiting = false }) {
  return (
    <div
      className={`fixed inset-0 z-[300] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-white px-6 transition-opacity duration-300 ease-out ${exiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-label="Loading JUnited"
      role="status"
    >
      <img
        src="/brand-star-loader.png"
        alt=""
        className={`splash-star-loader h-28 w-28 object-contain ${exiting ? '' : 'splash-star-loader--active'}`}
      />
    </div>
  );
}
