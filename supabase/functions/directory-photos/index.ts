import { FIVE_TOWNS_PHOTO_CATALOG } from '../_shared/fiveTownsDirectoryPhotoCatalog.ts';
import { createDirectoryPhotoHandler } from './handler.ts';

const handler = createDirectoryPhotoHandler({
  apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY') || '',
  catalog: FIVE_TOWNS_PHOTO_CATALOG,
});

Deno.serve(handler);
