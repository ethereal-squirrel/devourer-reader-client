export const flags = {
  collections: true,
  providers: {
    dropbox: false,
    googleDrive: true,
    opds: true,
  },
};

export const getFlag = (flag: keyof typeof flags) => {
  return flags[flag];
};
