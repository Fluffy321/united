import { useState, useEffect, useCallback } from 'react';
import {
  getStoredCandleLocation,
  setCandleLocation,
  clearCandleLocation,
  getBrowserTzid,
  reverseGeocode,
  requestGPSLocation,
  DEFAULT_LOCATION,
} from '@/lib/shabbatLocation';

function resolveInitialLocation() {
  const stored = getStoredCandleLocation();
  if (!stored || stored.type === 'declined') return DEFAULT_LOCATION;
  return stored;
}

// options.autoRequest — if true, trigger GPS on first mount when no stored pref exists
export default function useShabbatLocation({ autoRequest = false } = {}) {
  const [location, setLocation] = useState(resolveInitialLocation);
  const [loading, setLoading] = useState(() => {
    if (!autoRequest) return false;
    const stored = getStoredCandleLocation();
    return !stored; // loading only if no stored pref and autoRequest is on
  });
  const [error, setError] = useState(null);

  const applyGPS = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await requestGPSLocation();
      const { latitude: lat, longitude: lng } = pos.coords;
      const tzid = getBrowserTzid();
      const label = await reverseGeocode(lat, lng);
      const pref = { type: 'gps', lat, lng, label, tzid };
      setCandleLocation(pref);
      setLocation(pref);
      return pref;
    } catch (err) {
      if (err.code === 1) { // PERMISSION_DENIED
        setCandleLocation({ type: 'declined' });
        setError('declined');
      } else {
        setError('unavailable');
      }
      setLocation(DEFAULT_LOCATION);
      return DEFAULT_LOCATION;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoRequest) return;
    const stored = getStoredCandleLocation();
    if (stored) return; // already have a preference, don't re-ask
    applyGPS();
  }, []); // intentionally runs once on mount

  // Allow re-triggering GPS from Settings (clears any 'declined' flag first)
  const requestGPS = useCallback(() => {
    clearCandleLocation();
    return applyGPS();
  }, [applyGPS]);

  const setManualCity = useCallback((lat, lng, label, tzid) => {
    const pref = { type: 'manual', lat, lng, label, tzid: tzid || getBrowserTzid() };
    setCandleLocation(pref);
    setLocation(pref);
    setError(null);
  }, []);

  const resetToDefault = useCallback(() => {
    clearCandleLocation();
    setLocation(DEFAULT_LOCATION);
    setError(null);
  }, []);

  return {
    location,
    locationLoading: loading,
    locationError: error,
    isDefault: location.type === 'default',
    requestGPS,
    setManualCity,
    resetToDefault,
  };
}
