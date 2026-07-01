import { useState, useEffect, useCallback } from 'react';
import {
  getStoredCandleLocation,
  getCandleLocationPermission,
  setCandleLocation,
  setCandleLocationPermission,
  setSessionCandleLocation,
  clearCandleLocation,
  getBrowserTzid,
  reverseGeocode,
  requestGPSLocation,
  DEFAULT_LOCATION,
  isResolvedLocationLabel,
  subscribeCandleLocation,
  subscribeCandleLocationPermission,
  getStoredCandleOffset,
  setCandleOffset,
} from '@/lib/shabbatLocation';

function resolveInitialLocation() {
  const stored = getStoredCandleLocation();
  if (!stored || stored.type === 'declined') return DEFAULT_LOCATION;
  return stored;
}

// options.autoRequest — if true, trigger GPS on first mount when no stored pref exists
export default function useShabbatLocation({ autoRequest = false } = {}) {
  const [location, setLocation] = useState(resolveInitialLocation);
  const [offset, setOffsetState] = useState(getStoredCandleOffset);
  const [permission, setPermission] = useState(getCandleLocationPermission);
  const [loading, setLoading] = useState(() => {
    if (!autoRequest) return false;
    const stored = getStoredCandleLocation();
    return !stored && getCandleLocationPermission() === 'always';
  });
  const [error, setError] = useState(null);

  const applyGPS = useCallback(async ({ mode = 'once' } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const pos = await requestGPSLocation();
      const { latitude: lat, longitude: lng } = pos.coords;
      const tzid = getBrowserTzid();
      const label = await reverseGeocode(lat, lng);
      const pref = { type: mode === 'always' ? 'gps' : 'gps-once', lat, lng, label: label || 'Location unavailable', tzid };
      if (!label) setError('unresolved');
      if (mode === 'always') {
        setCandleLocationPermission('always');
        setPermission('always');
        setCandleLocation(pref);
      } else {
        setSessionCandleLocation(pref);
      }
      setLocation(pref);
      return pref;
    } catch (err) {
      if (err.code === 1) { // PERMISSION_DENIED
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
    if (permission === 'always') applyGPS({ mode: 'always' });
  }, []); // intentionally runs once on mount

  useEffect(() => {
    return subscribeCandleLocation((event) => {
      const next = event.detail || resolveInitialLocation();
      setLocation(next);
      setOffsetState(next?.offset ?? 18);
      setError(null);
    });
  }, []);

  useEffect(() => {
    return subscribeCandleLocationPermission((event) => {
      setPermission(event.detail || 'ask');
    });
  }, []);

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    if (!['gps', 'gps-once', 'manual'].includes(location.type)) return;
    if (isResolvedLocationLabel(location.label)) return;

    let cancelled = false;
    reverseGeocode(location.lat, location.lng).then((label) => {
      if (cancelled) return;
      if (!label) {
        setError('unresolved');
        return;
      }
      const next = { ...location, label };
      if (location.type === 'gps-once') {
        setSessionCandleLocation(next);
      } else {
        setCandleLocation(next);
      }
      setLocation(next);
      setError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lng, location?.label, location?.type]);

  const requestGPS = useCallback((mode = 'once') => {
    const previous = getStoredCandleLocation();
    clearCandleLocation();
    return applyGPS({ mode }).then((result) => {
      if (result === DEFAULT_LOCATION && previous && previous.type !== 'declined') {
        // GPS failed — restore the prior preference so the user doesn't lose their location
        setCandleLocation(previous);
        setLocation(previous);
      }
      return result;
    });
  }, [applyGPS]);

  const allowOnce = useCallback(() => requestGPS('once'), [requestGPS]);

  const allowAlways = useCallback(() => requestGPS('always'), [requestGPS]);

  const denyLocation = useCallback(() => {
    setCandleLocationPermission('never');
    setPermission('never');
    clearCandleLocation();
    setCandleLocation({ type: 'declined' });
    setLocation(DEFAULT_LOCATION);
    setError('declined');
  }, []);

  const askLater = useCallback(() => {
    setCandleLocationPermission('ask');
    setPermission('ask');
    clearCandleLocation();
    setLocation(DEFAULT_LOCATION);
    setError(null);
  }, []);

  const setManualCity = useCallback((lat, lng, label, tzid) => {
    const pref = { type: 'manual', lat, lng, label, tzid: tzid || getBrowserTzid() };
    setCandleLocation(pref);
    setLocation(pref);
    setError(null);
  }, []);

  const resetToDefault = useCallback(() => {
    clearCandleLocation();
    setLocation(DEFAULT_LOCATION);
    setOffsetState(18);
    setError(null);
  }, []);

  const setOffset = useCallback((minutes) => {
    setCandleOffset(minutes);
    setOffsetState(minutes);
  }, []);

  return {
    location,
    offset,
    setOffset,
    locationLoading: loading,
    locationError: error,
    locationPermission: permission,
    shouldAskLocation: permission === 'ask' && location.type === 'default',
    isDefault: location.type === 'default',
    requestGPS,
    allowOnce,
    allowAlways,
    denyLocation,
    askLater,
    setManualCity,
    resetToDefault,
  };
}
