export interface Provider {
  key: string;
  name: string;
  route: string;
  web: boolean;
}

export const CLOUD_PROVIDERS: Provider[] = [
  {
    key: "googleDrive",
    name: "Google Drive",
    route: "/providers/google",
    web: false,
  },
  { key: "dropbox", name: "Dropbox", route: "/providers/dropbox", web: false },
  { key: "opds", name: "OPDS", route: "/opds", web: true },
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
