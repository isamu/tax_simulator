// Storage can be missing or throw (private browsing, blocked site data), so every access falls back quietly.
export type SavedInputs = {
  read: () => string | null;
  write: (value: string) => void;
  clear: () => void;
};

export const savedInputs = (key: string, storage: () => Storage): SavedInputs => ({
  read: () => {
    try {
      return storage().getItem(key);
    } catch {
      return null;
    }
  },
  write: (value) => {
    try {
      storage().setItem(key, value);
    } catch {
      // Saving is a convenience; the page works without it.
    }
  },
  clear: () => {
    try {
      storage().removeItem(key);
    } catch {
      // Nothing was saved, or it cannot be removed; either way the page resets from defaults.
    }
  },
});
