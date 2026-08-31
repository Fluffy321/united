import catalog from './fiveTownsDirectoryPhotoCatalog.json' with { type: 'json' };

export type DirectoryPhotoCatalogEntry = {
  name: string;
  address: string;
};

export const FIVE_TOWNS_PHOTO_CATALOG = Object.freeze(catalog) as Readonly<Record<string, DirectoryPhotoCatalogEntry>>;
