import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  loadJewishHubPreferences,
  saveJewishHubPreferences,
  subscribeJewishHubPreferences,
} from '@/services/jewishHubPreferences';

function userKey(user) {
  return user?.id || user?.email || 'guest';
}

export default function useJewishHubPreferences() {
  const { user } = useAuth();
  const key = userKey(user);
  const [preferences, setPreferencesState] = useState(() => loadJewishHubPreferences(key));

  useEffect(() => {
    setPreferencesState(loadJewishHubPreferences(key));
  }, [key]);

  useEffect(() => {
    return subscribeJewishHubPreferences((event) => {
      if (event.detail?.userId === key) setPreferencesState(event.detail.preferences);
    });
  }, [key]);

  const setPreferences = useCallback((updater) => {
    setPreferencesState((current) => {
      const nextValue = typeof updater === 'function' ? updater(current) : updater;
      return saveJewishHubPreferences(key, nextValue);
    });
  }, [key]);

  return useMemo(() => ({
    preferences,
    setPreferences,
    user,
    userKey: key,
  }), [preferences, setPreferences, user, key]);
}
