import { describe, expect, test } from "vitest";
import { savedInputs } from "../src/utils/storage";

const memoryStorage = (): Storage => {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
};

const failing = (): Storage => {
  throw new Error("SecurityError: access denied");
};

describe("savedInputs", () => {
  test("writes, reads back and clears under its own key", () => {
    const storage = memoryStorage();
    const saved = savedInputs("a", () => storage);
    const other = savedInputs("b", () => storage);
    expect(saved.read()).toBeNull();
    saved.write("income=5000000");
    other.write("x");
    expect(saved.read()).toBe("income=5000000");
    saved.clear();
    expect(saved.read()).toBeNull();
    expect(other.read()).toBe("x");
  });

  test("a storage that throws reads as empty and never throws", () => {
    const saved = savedInputs("a", failing);
    expect(saved.read()).toBeNull();
    expect(() => saved.write("income=1")).not.toThrow();
    expect(() => saved.clear()).not.toThrow();
  });

  test("a full storage keeps the page working", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const saved = savedInputs("a", () => storage);
    expect(() => saved.write("income=1")).not.toThrow();
    expect(saved.read()).toBeNull();
  });
});
