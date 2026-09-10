import { useEffect, useRef, useState } from "react";

/**
 * Enregistrement automatique : appelle `save` après un court délai
 * dès que les valeurs surveillées changent (jamais au premier rendu).
 */
export function useAutoSave(
  values: unknown,
  save: () => void,
  { delay = 1500, enabled = true }: { delay?: number; enabled?: boolean } = {},
) {
  const snapshot = JSON.stringify(values ?? null);
  const first = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => saveRef.current(), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, delay, enabled]);
}

/**
 * Brouillon local : garde ce qui est en cours de saisie même si
 * l'app est fermée, et le restaure au retour.
 */
export function useLocalDraft<T>(
  key: string,
  values: T,
  restore: (draft: T) => void,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [restored, setRestored] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    if (!enabled) {
      setRestored(true);
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw) restoreRef.current(JSON.parse(raw) as T);
    } catch {
      /* brouillon illisible : on l'ignore */
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const snapshot = JSON.stringify(values ?? null);
  useEffect(() => {
    if (!enabled || !restored) return;
    try {
      localStorage.setItem(key, snapshot);
    } catch {
      /* stockage plein : on ignore */
    }
  }, [key, snapshot, restored, enabled]);

  const clear = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* rien à faire */
    }
  };

  return { restored, clear };
}
