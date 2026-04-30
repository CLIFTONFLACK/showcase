import { useState, useEffect, useRef } from 'react';
import { GAME_STORAGE_KEY } from '../state/brandConfig.js';

const DEFAULT = {
  totalPoints: 0,
  user: null,
  claimed: [],
  lastPlayed: null,
  lastPlayedAt: null,
  lastScore: 0,
  streak: 0,
};

export function usePersistence() {
  const [state, setState] = useState(() => load() ?? DEFAULT);
  const storageAvailable = useRef(true);

  useEffect(() => {
    if (!storageAvailable.current) return;
    try {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
    } catch {
      storageAvailable.current = false;
    }
  }, [state]);

  return [state, setState, storageAvailable.current];
}

function load() {
  try {
    const raw = localStorage.getItem(GAME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
