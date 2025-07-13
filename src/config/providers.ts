export interface Provider {
  key: string;
  name: string;
  route: string;
}

export const CLOUD_PROVIDERS: Provider[] = [
  { key: "googleDrive", name: "Google Drive", route: "/providers/google" },
  { key: "dropbox", name: "Dropbox", route: "/providers/dropbox" },
  { key: "opds", name: "OPDS", route: "/opds" },
];

export const CLIENT_DOWNLOADS = [
  {
    name: "Devourer for Desktop",
    route: "https://devourer.app/downloads",
  },
  {
    name: "Devourer for iOS",
    route: "https://devourer.app/downloads",
  },
  {
    name: "Devourer for Android",
    route: "https://devourer.app/downloads",
  },
];
