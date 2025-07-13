import { CLOUD_PROVIDERS, CLIENT_DOWNLOADS, Provider } from '../../src/config/providers';

describe('Providers Configuration', () => {
  describe('CLOUD_PROVIDERS', () => {
    it('should be an array', () => {
      expect(Array.isArray(CLOUD_PROVIDERS)).toBe(true);
    });

    it('should not be empty', () => {
      expect(CLOUD_PROVIDERS.length).toBeGreaterThan(0);
    });

    it('should have valid provider objects', () => {
      CLOUD_PROVIDERS.forEach((provider: Provider) => {
        expect(provider).toEqual(
          expect.objectContaining({
            key: expect.any(String),
            name: expect.any(String),
            route: expect.any(String),
          })
        );
      });
    });

    it('should have unique keys', () => {
      const keys = CLOUD_PROVIDERS.map(provider => provider.key);
      const uniqueKeys = new Set(keys);
      
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have non-empty properties', () => {
      CLOUD_PROVIDERS.forEach(provider => {
        expect(provider.key).toBeTruthy();
        expect(provider.name).toBeTruthy();
        expect(provider.route).toBeTruthy();
      });
    });
  });

  describe('CLIENT_DOWNLOADS', () => {
    it('should be an array', () => {
      expect(Array.isArray(CLIENT_DOWNLOADS)).toBe(true);
    });

    it('should not be empty', () => {
      expect(CLIENT_DOWNLOADS.length).toBeGreaterThan(0);
    });

    it('should have valid download objects', () => {
      CLIENT_DOWNLOADS.forEach((download) => {
        expect(download).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            route: expect.any(String),
          })
        );
      });
    });

    it('should have valid URLs', () => {
      CLIENT_DOWNLOADS.forEach(download => {
        expect(download.route).toBeTruthy();
        expect(() => new URL(download.route)).not.toThrow();
      });
    });
  });

  describe('Provider Quality', () => {
    it('should have meaningful names for cloud providers', () => {
      CLOUD_PROVIDERS.forEach(provider => {
        expect(provider.name.length).toBeGreaterThan(2);
        expect(provider.name).toMatch(/^[A-Za-z]/);
      });
    });

    it('should have consistent key format for cloud providers', () => {
      CLOUD_PROVIDERS.forEach(provider => {
        expect(provider.key).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
      });
    });

    it('should have valid routes for cloud providers', () => {
      CLOUD_PROVIDERS.forEach(provider => {
        expect(provider.route).toMatch(/^\/[a-zA-Z0-9/-]+$/);
      });
    });
  });
});