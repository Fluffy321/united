import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() || 13);
    }
  }, [center, map]);

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    const timers = [0, 120, 350, 800].map((delay) => window.setTimeout(invalidate, delay));
    window.addEventListener('resize', invalidate);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);

  return null;
}
