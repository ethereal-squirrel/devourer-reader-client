import '@testing-library/jest-dom';
import React from 'react';

// Mock Tauri APIs globally
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn().mockImplementation((command: string, args?: any) => {
    switch (command) {
      case 'download_file':
        return Promise.resolve();
      case 'unzip_file':
        return Promise.resolve();
      case 'unrar_file':
        return Promise.resolve();
      case 'get_files_in_directory':
        return Promise.resolve(['file1.jpg', 'file2.jpg', 'file3.jpg']);
      default:
        return Promise.resolve();
    }
  }),
  convertFileSrc: jest.fn((path: string) => `tauri://localhost/${path}`),
}));

jest.mock('@tauri-apps/api/path', () => ({
  join: jest.fn((...paths: string[]) => paths.join('/')),
  appLocalDataDir: jest.fn(() => Promise.resolve('/mock/app/data')),
}));

jest.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  BaseDirectory: {
    AppLocalData: 'AppLocalData',
  },
}));

// Mock react-router
jest.mock('react-router', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
  useSearchParams: () => [new URLSearchParams()],
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
}));

// Make React available globally for components that use React.memo
(global as any).React = React;

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance.now for consistent timing in tests
const mockPerformanceNow = jest.fn(() => Date.now());
global.performance.now = mockPerformanceNow;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockPerformanceNow.mockReturnValue(Date.now());
});

// Error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally exit the process
  // process.exit(1);
});

// Suppress console.error for cleaner test output (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});