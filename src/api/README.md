# API Folder

This folder holds the code that connects the app to outside services.

## `supabaseClient.js`

This is the main Supabase setup file.

It reads the Supabase settings from `.env.local`, creates the Supabase client, and exports small helper values that other files can use.

Entity reads and writes use named operations from `src/services/entityServices.js`.
Shared normalization and query behavior lives in `src/services/supabaseRepository.js`.
