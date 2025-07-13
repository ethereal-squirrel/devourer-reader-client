// Mock Tauri APIs for testing

// Mock @tauri-apps/api/core
export const invoke = jest.fn().mockImplementation((command: string, args?: any) => {
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
});

export const convertFileSrc = jest.fn((path: string) => `tauri://localhost/${path}`);

// Mock @tauri-apps/api/path
export const join = jest.fn((...paths: string[]) => paths.join('/'));
export const appLocalDataDir = jest.fn(() => Promise.resolve('/mock/app/data'));

// Mock @tauri-apps/plugin-fs
export const mkdir = jest.fn(() => Promise.resolve());
export const remove = jest.fn(() => Promise.resolve());
export const BaseDirectory = {
  AppLocalData: 'AppLocalData',
};

// Mock database
export const mockDatabase = {
  select: jest.fn(() => Promise.resolve([])),
  execute: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
};

// Export all mocks
export default {
  invoke,
  convertFileSrc,
  join,
  appLocalDataDir,
  mkdir,
  remove,
  BaseDirectory,
  mockDatabase,
};