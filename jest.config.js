/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tauri-apps/api/core$': '<rootDir>/tests/__mocks__/tauri.ts',
    '^@tauri-apps/api/path$': '<rootDir>/tests/__mocks__/tauri.ts',
    '^@tauri-apps/plugin-fs$': '<rootDir>/tests/__mocks__/tauri.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};