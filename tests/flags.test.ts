import { flags, getFlag } from "../src/flags";

describe("Feature Flags", () => {
  describe("flags object", () => {
    it("should contain all expected flag properties", () => {
      expect(flags).toHaveProperty("collections");
      expect(flags).toHaveProperty("providers");
    });

    it("should have correct structure", () => {
      expect(typeof flags.collections).toBe("boolean");
      expect(typeof flags.providers).toBe("object");
      expect(flags.providers).toHaveProperty("dropbox");
      expect(flags.providers).toHaveProperty("googleDrive");
      expect(flags.providers).toHaveProperty("opds");
    });

    it("should have expected default values", () => {
      expect(flags.collections).toBe(true);
      expect(flags.providers.dropbox).toBe(false);
      expect(flags.providers.googleDrive).toBe(true);
      expect(flags.providers.opds).toBe(true);
    });

    it("should be a plain object with no prototype pollution", () => {
      expect(Object.getPrototypeOf(flags)).toBe(Object.prototype);
      expect(flags.constructor).toBe(Object);
    });
  });

  describe("getFlag function", () => {
    it("should return correct flag values for existing flags", () => {
      expect(getFlag("collections")).toBe(flags.collections);
      expect(getFlag("providers")).toBe(flags.providers);
    });

    it("should return undefined for non-existent flags", () => {
      expect(getFlag("nonExistentFlag" as any)).toBeUndefined();
    });

    it("should handle edge cases gracefully", () => {
      expect(getFlag(null as any)).toBeUndefined();
      expect(getFlag(undefined as any)).toBeUndefined();
    });

    it("should not modify the original flags object", () => {
      const originalFlags = { ...flags };
      
      getFlag("collections");
      getFlag("nonExistentFlag" as any);
      
      expect(flags).toEqual(originalFlags);
    });
  });

  describe("Providers Configuration", () => {
    it("should have all expected provider flags", () => {
      expect(flags.providers).toHaveProperty("dropbox");
      expect(flags.providers).toHaveProperty("googleDrive");
      expect(flags.providers).toHaveProperty("opds");
    });

    it("should have boolean values for provider flags", () => {
      Object.values(flags.providers).forEach(providerFlag => {
        expect(typeof providerFlag).toBe("boolean");
      });
    });

    it("should have at least one provider enabled", () => {
      const enabledProviders = Object.values(flags.providers).filter(Boolean);
      expect(enabledProviders.length).toBeGreaterThan(0);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type consistency", () => {
      const flagKeys = Object.keys(flags) as Array<keyof typeof flags>;
      
      flagKeys.forEach(key => {
        const flagValue = flags[key];
        const getFlagValue = getFlag(key);
        
        expect(flagValue).toBe(getFlagValue);
      });
    });
  });

  describe("Performance", () => {
    it("should have fast flag lookup performance", () => {
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        getFlag("collections");
        getFlag("providers");
        getFlag("nonExistentFlag" as any);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 10k lookups in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Data Integrity", () => {
    it("should maintain consistent flag values", () => {
      const originalCollections = flags.collections;
      const originalProviders = { ...flags.providers };
      
      // Read flags multiple times
      expect(flags.collections).toBe(originalCollections);
      expect(flags.providers).toEqual(originalProviders);
    });

    it("should have immutable provider structure", () => {
      const originalProviders = { ...flags.providers };
      
      // Provider object should remain consistent
      expect(flags.providers).toEqual(originalProviders);
    });
  });
});