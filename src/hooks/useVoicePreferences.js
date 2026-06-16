import { useState, useCallback, useEffect } from 'react';
import {
  VOICE_CONFIG,
  getUserVoicePreferences,
  saveUserVoicePreferences,
  resetVoicePreferences,
  mergeVoicePreferences,
} from '../config/voiceConfig';

/**
 * Custom hook to manage voice assistant preferences
 */
export const useVoicePreferences = () => {
  const [preferences, setPreferences] = useState(VOICE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const userPrefs = getUserVoicePreferences();
      const merged = mergeVoicePreferences(userPrefs);
      setPreferences(merged);
    } catch (err) {
      console.error('Failed to load voice preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update specific preference
   */
  const updatePreference = useCallback((path, value) => {
    setPreferences((prev) => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      setHasChanged(true);
      return updated;
    });
  }, []);

  /**
   * Update multiple preferences at once
   */
  const updatePreferences = useCallback((updates) => {
    setPreferences((prev) => {
      const updated = { ...prev };
      Object.entries(updates).forEach(([path, value]) => {
        const keys = path.split('.');
        let current = updated;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
      });
      setHasChanged(true);
      return updated;
    });
  }, []);

  /**
   * Save preferences to localStorage
   */
  const savePreferences = useCallback(() => {
    try {
      const saved = saveUserVoicePreferences(preferences);
      if (saved) {
        setHasChanged(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save voice preferences:', err);
      return false;
    }
  }, [preferences]);

  /**
   * Reset preferences to defaults
   */
  const reset = useCallback(() => {
    try {
      resetVoicePreferences();
      setPreferences(VOICE_CONFIG);
      setHasChanged(false);
      return true;
    } catch (err) {
      console.error('Failed to reset voice preferences:', err);
      return false;
    }
  }, []);

  /**
   * Get specific preference value
   */
  const getPreference = useCallback(
    (path) => {
      const keys = path.split('.');
      let current = preferences;

      for (const key of keys) {
        current = current[key];
        if (current === undefined) return undefined;
      }

      return current;
    },
    [preferences]
  );

  /**
   * Get all preferences for a category
   */
  const getCategory = useCallback(
    (category) => {
      return preferences[category] || {};
    },
    [preferences]
  );

  return {
    preferences,
    isLoading,
    hasChanged,
    updatePreference,
    updatePreferences,
    savePreferences,
    reset,
    getPreference,
    getCategory,
  };
};

export default useVoicePreferences;
