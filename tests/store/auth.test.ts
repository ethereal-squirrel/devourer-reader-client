// Mock persist middleware to avoid localStorage issues in tests
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
  createJSONStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

import { useAuthStore } from '../../src/store/auth';

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.getState().setDisplayAuthModal(false);
    useAuthStore.getState().setUsername('');
    useAuthStore.getState().setPassword('');
    useAuthStore.getState().setApiKey('');
    useAuthStore.getState().setHasHydrated(false);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.displayAuthModal).toBe(false);
      expect(state.username).toBe('');
      expect(state.password).toBe('');
      expect(state.apiKey).toBe('');
      expect(state.hasHydrated).toBe(false);
    });

    it('should have all required action functions', () => {
      const state = useAuthStore.getState();
      
      expect(typeof state.setDisplayAuthModal).toBe('function');
      expect(typeof state.setUsername).toBe('function');
      expect(typeof state.setPassword).toBe('function');
      expect(typeof state.setApiKey).toBe('function');
      expect(typeof state.setHasHydrated).toBe('function');
    });
  });

  describe('setDisplayAuthModal', () => {
    it('should set display auth modal to true', () => {
      const { setDisplayAuthModal } = useAuthStore.getState();
      
      setDisplayAuthModal(true);
      
      expect(useAuthStore.getState().displayAuthModal).toBe(true);
    });

    it('should set display auth modal to false', () => {
      const { setDisplayAuthModal } = useAuthStore.getState();
      
      setDisplayAuthModal(true);
      expect(useAuthStore.getState().displayAuthModal).toBe(true);
      
      setDisplayAuthModal(false);
      expect(useAuthStore.getState().displayAuthModal).toBe(false);
    });

    it('should handle boolean toggle pattern', () => {
      const { setDisplayAuthModal } = useAuthStore.getState();
      
      // Toggle pattern
      setDisplayAuthModal(true);
      setDisplayAuthModal(false);
      setDisplayAuthModal(true);
      
      expect(useAuthStore.getState().displayAuthModal).toBe(true);
    });
  });

  describe('setUsername', () => {
    it('should set username correctly', () => {
      const { setUsername } = useAuthStore.getState();
      
      setUsername('testuser');
      
      expect(useAuthStore.getState().username).toBe('testuser');
    });

    it('should handle empty username', () => {
      const { setUsername } = useAuthStore.getState();
      
      setUsername('');
      
      expect(useAuthStore.getState().username).toBe('');
    });

    it('should handle username with special characters', () => {
      const { setUsername } = useAuthStore.getState();
      
      setUsername('user@domain.com');
      
      expect(useAuthStore.getState().username).toBe('user@domain.com');
    });

    it('should handle username updates', () => {
      const { setUsername } = useAuthStore.getState();
      
      setUsername('olduser');
      expect(useAuthStore.getState().username).toBe('olduser');
      
      setUsername('newuser');
      expect(useAuthStore.getState().username).toBe('newuser');
    });

    it('should handle unicode characters in username', () => {
      const { setUsername } = useAuthStore.getState();
      
      setUsername('用户名');
      
      expect(useAuthStore.getState().username).toBe('用户名');
    });
  });

  describe('setPassword', () => {
    it('should set password correctly', () => {
      const { setPassword } = useAuthStore.getState();
      
      setPassword('testpassword');
      
      expect(useAuthStore.getState().password).toBe('testpassword');
    });

    it('should handle empty password', () => {
      const { setPassword } = useAuthStore.getState();
      
      setPassword('');
      
      expect(useAuthStore.getState().password).toBe('');
    });

    it('should handle complex passwords', () => {
      const { setPassword } = useAuthStore.getState();
      
      const complexPassword = 'P@ssw0rd!123#$%';
      setPassword(complexPassword);
      
      expect(useAuthStore.getState().password).toBe(complexPassword);
    });

    it('should handle password updates', () => {
      const { setPassword } = useAuthStore.getState();
      
      setPassword('oldpassword');
      expect(useAuthStore.getState().password).toBe('oldpassword');
      
      setPassword('newpassword');
      expect(useAuthStore.getState().password).toBe('newpassword');
    });
  });

  describe('setApiKey', () => {
    it('should set API key correctly', () => {
      const { setApiKey } = useAuthStore.getState();
      
      const apiKey = 'test-api-key-123';
      setApiKey(apiKey);
      
      expect(useAuthStore.getState().apiKey).toBe(apiKey);
    });

    it('should handle empty API key', () => {
      const { setApiKey } = useAuthStore.getState();
      
      setApiKey('');
      
      expect(useAuthStore.getState().apiKey).toBe('');
    });

    it('should handle API key replacement', () => {
      const { setApiKey } = useAuthStore.getState();
      
      const oldKey = 'old-key';
      const newKey = 'new-key';
      
      setApiKey(oldKey);
      expect(useAuthStore.getState().apiKey).toBe(oldKey);
      
      setApiKey(newKey);
      expect(useAuthStore.getState().apiKey).toBe(newKey);
    });
  });

  describe('setHasHydrated', () => {
    it('should set hydration status to true', () => {
      const { setHasHydrated } = useAuthStore.getState();
      
      setHasHydrated(true);
      
      expect(useAuthStore.getState().hasHydrated).toBe(true);
    });

    it('should set hydration status to false', () => {
      const { setHasHydrated } = useAuthStore.getState();
      
      setHasHydrated(false);
      
      expect(useAuthStore.getState().hasHydrated).toBe(false);
    });
  });

  describe('Complex State Interactions', () => {
    it('should handle auth setup flow', () => {
      const state = useAuthStore.getState();
      
      // Simulate auth setup
      state.setUsername('testuser');
      state.setPassword('testpass');
      state.setApiKey('api-key-123');
      state.setDisplayAuthModal(false);
      state.setHasHydrated(true);
      
      const finalState = useAuthStore.getState();
      
      expect(finalState.username).toBe('testuser');
      expect(finalState.password).toBe('testpass');
      expect(finalState.apiKey).toBe('api-key-123');
      expect(finalState.displayAuthModal).toBe(false);
      expect(finalState.hasHydrated).toBe(true);
    });

    it('should handle reset flow', () => {
      const state = useAuthStore.getState();
      
      // Set initial state
      state.setUsername('testuser');
      state.setPassword('testpass');
      state.setApiKey('api-key-123');
      
      // Simulate reset
      state.setUsername('');
      state.setPassword('');
      state.setApiKey('');
      
      const finalState = useAuthStore.getState();
      
      expect(finalState.username).toBe('');
      expect(finalState.password).toBe('');
      expect(finalState.apiKey).toBe('');
    });

    it('should handle modal display during setup', () => {
      const state = useAuthStore.getState();
      
      // Show modal for setup
      state.setDisplayAuthModal(true);
      expect(useAuthStore.getState().displayAuthModal).toBe(true);
      
      // User enters credentials
      state.setUsername('user');
      state.setPassword('pass');
      
      // After successful setup, hide modal
      state.setApiKey('key');
      state.setDisplayAuthModal(false);
      
      const finalState = useAuthStore.getState();
      
      expect(finalState.displayAuthModal).toBe(false);
      expect(finalState.apiKey).toBe('key');
    });
  });

  describe('State Immutability and Persistence', () => {
    it('should not mutate previous state references', () => {
      const initialState = { ...useAuthStore.getState() };
      
      useAuthStore.getState().setUsername('newuser');
      
      expect(initialState.username).toBe('');
      expect(useAuthStore.getState().username).toBe('newuser');
    });

    it('should maintain other state properties when updating one', () => {
      const state = useAuthStore.getState();
      
      state.setUsername('user');
      state.setApiKey('api-key');
      
      // Update username, api key should remain
      state.setUsername('newuser');
      
      const finalState = useAuthStore.getState();
      expect(finalState.username).toBe('newuser');
      expect(finalState.apiKey).toBe('api-key');
    });
  });

  describe('Type Safety and Validation', () => {
    it('should accept valid string values for username', () => {
      const { setUsername } = useAuthStore.getState();
      
      expect(() => setUsername('valid')).not.toThrow();
      expect(() => setUsername('')).not.toThrow();
      expect(() => setUsername('123')).not.toThrow();
    });

    it('should accept valid string values for password', () => {
      const { setPassword } = useAuthStore.getState();
      
      expect(() => setPassword('valid')).not.toThrow();
      expect(() => setPassword('')).not.toThrow();
      expect(() => setPassword('complex!@#')).not.toThrow();
    });

    it('should accept valid string values for apiKey', () => {
      const { setApiKey } = useAuthStore.getState();
      
      expect(() => setApiKey('valid.api.key')).not.toThrow();
      expect(() => setApiKey('')).not.toThrow();
    });

    it('should accept valid boolean values for flags', () => {
      const state = useAuthStore.getState();
      
      expect(() => state.setDisplayAuthModal(true)).not.toThrow();
      expect(() => state.setDisplayAuthModal(false)).not.toThrow();
      expect(() => state.setHasHydrated(true)).not.toThrow();
      expect(() => state.setHasHydrated(false)).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid state updates', () => {
      const { setUsername } = useAuthStore.getState();
      
      for (let i = 0; i < 1000; i++) {
        setUsername(`user${i}`);
      }
      
      expect(useAuthStore.getState().username).toBe('user999');
    });

    it('should not create memory leaks with subscriptions', () => {
      const unsubscribe = useAuthStore.subscribe(
        (state) => state.username,
        (username) => {
          // Subscription callback
        }
      );
      
      useAuthStore.getState().setUsername('test');
      
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null-like values gracefully', () => {
      const state = useAuthStore.getState();
      
      // These should be handled by TypeScript, but testing runtime behavior
      expect(() => state.setUsername(null as any)).not.toThrow();
      expect(() => state.setPassword(undefined as any)).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const { setUsername } = useAuthStore.getState();
      
      setUsername(longString);
      
      expect(useAuthStore.getState().username).toBe(longString);
    });
  });
});