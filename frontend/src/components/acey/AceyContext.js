import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { companionAPI } from '../../utils/api';
import {
  DEFAULT_MOOD_ID,
  DEFAULT_OUTFIT_ID,
  MOODS,
  OUTFITS,
  PREFERENCES_KEY,
  isKnownPreference,
  readPreferences,
} from '../mascot/mascotCatalog';

const PROFILE_CACHE_PREFIX = 'acey-profile-v1:';
const SAVE_DELAY_MS = 700;
const ONBOARDING_STATUSES = ['completed', 'skipped', 'dismissed'];

const AceyContext = createContext(null);

export const normalizeAppearance = (appearance = {}) => ({
  outfitId: isKnownPreference(OUTFITS, appearance?.outfitId) ? appearance.outfitId : DEFAULT_OUTFIT_ID,
  moodId: isKnownPreference(MOODS, appearance?.moodId) ? appearance.moodId : DEFAULT_MOOD_ID,
  accessoriesEnabled: typeof appearance?.accessoriesEnabled === 'boolean' ? appearance.accessoriesEnabled : true,
});

export const normalizeProfile = (profile = {}) => ({
  appearance: normalizeAppearance(profile?.appearance),
  preferences: {
    minimized: profile?.preferences?.minimized === true,
    bubblesEnabled: profile?.preferences?.bubblesEnabled !== false,
  },
  onboarding: ONBOARDING_STATUSES.includes(profile?.onboarding?.status)
    ? { status: profile.onboarding.status }
    : null,
});

const readJson = (key) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch (error) {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Private browsing can block storage; the in-memory profile still works.
  }
};

// The landing-page customizer has always used this key, so keep it current for
// signed-out visits and for the first sign-in on this browser.
const writeAnonymousAppearance = ({ outfitId, moodId, accessoriesEnabled }) => {
  writeJson(PREFERENCES_KEY, { outfitId, moodId, accessoriesEnabled });
};

const hasSavedAppearance = (appearance) => Boolean(appearance && appearance.outfitId);

const mergeSections = (target, update) => ({
  appearance: update.appearance ? { ...(target.appearance || {}), ...update.appearance } : target.appearance,
  preferences: update.preferences ? { ...(target.preferences || {}), ...update.preferences } : target.preferences,
  onboarding: update.onboarding || target.onboarding,
});

// Used when a page renders the customizer without the app-wide provider.
const useStandaloneAcey = () => {
  const [profile, setProfile] = useState(() => normalizeProfile({ appearance: readPreferences() }));

  const updateAppearance = useCallback((partial) => {
    setProfile((current) => {
      const next = { ...current, appearance: normalizeAppearance({ ...current.appearance, ...partial }) };
      writeAnonymousAppearance(next.appearance);
      return next;
    });
  }, []);

  return useMemo(() => ({
    ...profile,
    isAuthenticated: false,
    isReady: true,
    syncStatus: 'local',
    updateAppearance,
    updatePreferences: () => {},
    setOnboardingStatus: () => {},
  }), [profile, updateAppearance]);
};

export const AceyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAppContext();
  const userId = isAuthenticated ? user?.id : null;
  const [profile, setProfile] = useState(() => normalizeProfile({ appearance: readPreferences() }));
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('local');
  const pendingRef = useRef({});
  const timerRef = useRef(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const cacheKey = userId ? `${PROFILE_CACHE_PREFIX}${userId}` : null;

  const flush = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    const update = pendingRef.current;
    pendingRef.current = {};
    const activeUserId = userIdRef.current;
    if (!activeUserId || !Object.keys(update).length) return;

    try {
      await companionAPI.updateProfile(update);
      if (userIdRef.current !== activeUserId) return;
      const key = `${PROFILE_CACHE_PREFIX}${activeUserId}`;
      writeJson(key, { ...(readJson(key) || {}), dirty: null });
      setSyncStatus('synced');
    } catch (error) {
      // Keep the change on this device and retry the next time Acey loads.
      if (userIdRef.current === activeUserId) setSyncStatus('offline');
    }
  }, []);

  const queueSave = useCallback((update, immediate = false) => {
    if (!userIdRef.current) return;
    pendingRef.current = mergeSections(pendingRef.current, update);
    const key = `${PROFILE_CACHE_PREFIX}${userIdRef.current}`;
    const cached = readJson(key) || {};
    writeJson(key, { ...cached, dirty: mergeSections(cached.dirty || {}, update) });
    window.clearTimeout(timerRef.current);
    if (immediate) flush();
    else timerRef.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [flush]);

  // Load the learner's Acey whenever the signed-in account changes.
  useEffect(() => {
    let active = true;
    window.clearTimeout(timerRef.current);
    pendingRef.current = {};

    if (!userId) {
      setProfile(normalizeProfile({ appearance: readPreferences() }));
      setSyncStatus('local');
      setIsReady(false);
      return undefined;
    }

    const cached = readJson(`${PROFILE_CACHE_PREFIX}${userId}`);
    const anonymous = readPreferences();
    setProfile(normalizeProfile(cached?.profile || { appearance: anonymous }));
    setIsReady(false);
    setSyncStatus('loading');

    const load = async () => {
      try {
        const response = await companionAPI.getProfile();
        if (!active) return;
        const server = response?.data || {};
        const unsaved = {};

        // Changes made while offline win over the older server copy.
        if (cached?.dirty) Object.assign(unsaved, cached.dirty);
        // First sign-in on this browser: keep the look chosen on the landing page.
        if (!hasSavedAppearance(server.appearance) && !unsaved.appearance && hasSavedAppearance(anonymous)) {
          unsaved.appearance = normalizeAppearance(anonymous);
        }

        const merged = normalizeProfile(mergeSections(server, unsaved));
        setProfile(merged);
        writeJson(`${PROFILE_CACHE_PREFIX}${userId}`, { profile: merged, dirty: Object.keys(unsaved).length ? unsaved : null });
        if (Object.keys(unsaved).length) {
          pendingRef.current = unsaved;
          flush();
        } else {
          setSyncStatus('synced');
        }
      } catch (error) {
        if (!active) return;
        setSyncStatus('offline');
      } finally {
        if (active) setIsReady(true);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [userId, flush]);

  // Save any queued change before the page is closed or the account switches.
  useEffect(() => {
    const handlePageHide = () => { flush(); };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      flush();
    };
  }, [flush, userId]);

  const persistLocal = useCallback((next) => {
    if (cacheKey) {
      const cached = readJson(cacheKey) || {};
      writeJson(cacheKey, { ...cached, profile: next });
    }
    writeAnonymousAppearance(next.appearance);
  }, [cacheKey]);

  const updateAppearance = useCallback((partial) => {
    setProfile((current) => {
      const next = { ...current, appearance: normalizeAppearance({ ...current.appearance, ...partial }) };
      persistLocal(next);
      queueSave({ appearance: next.appearance });
      return next;
    });
  }, [persistLocal, queueSave]);

  const updatePreferences = useCallback((partial) => {
    setProfile((current) => {
      const next = normalizeProfile({ ...current, preferences: { ...current.preferences, ...partial } });
      persistLocal(next);
      queueSave({ preferences: next.preferences });
      return next;
    });
  }, [persistLocal, queueSave]);

  const setOnboardingStatus = useCallback((status) => {
    if (!ONBOARDING_STATUSES.includes(status)) return;
    setProfile((current) => {
      const next = { ...current, onboarding: { status } };
      persistLocal(next);
      queueSave({ onboarding: { status } }, true);
      return next;
    });
  }, [persistLocal, queueSave]);

  const value = useMemo(() => ({
    ...profile,
    isAuthenticated: Boolean(userId),
    isReady,
    syncStatus,
    updateAppearance,
    updatePreferences,
    setOnboardingStatus,
  }), [profile, userId, isReady, syncStatus, updateAppearance, updatePreferences, setOnboardingStatus]);

  return <AceyContext.Provider value={value}>{children}</AceyContext.Provider>;
};

export const useAcey = () => {
  const context = useContext(AceyContext);
  const standalone = useStandaloneAcey();
  return context || standalone;
};

export default AceyContext;
