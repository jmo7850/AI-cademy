import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { buildRegistry, type Registry } from '../data/registry';
import { loadState, saveState } from './persistence';
import { reducer, type Action } from './reducer';
import type { AppState } from './schema';

interface Store {
  state: AppState;
  dispatch: (a: Action) => void;
  registry: Registry;
  storageError?: string;
}

const Ctx = createContext<Store | null>(null);

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function StoreProvider({ children, storage = safeStorage() }: { children: ReactNode; storage?: Storage }) {
  const loaded = useRef(loadState(storage));
  const [state, dispatch] = useReducer(reducer, loaded.current.state);
  const [saveError, setSaveError] = useState<string | undefined>();

  useEffect(() => {
    setSaveError(saveState(storage, state));
  }, [state, storage]);

  const registry = useMemo(
    () => buildRegistry({ importedEntries: state.importedEntries, importedCourses: state.importedCourses }),
    [state.importedEntries, state.importedCourses],
  );

  const value = useMemo(
    () => ({ state, dispatch, registry, storageError: saveError ?? loaded.current.error }),
    [state, registry, saveError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export const nowIso = () => new Date().toISOString();
