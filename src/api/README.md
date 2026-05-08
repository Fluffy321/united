# API Folder

This folder holds the code that connects the app to outside services.

## `supabaseClient.js`

This is the main Supabase setup file.

It reads the Supabase settings from `.env.local`, creates the Supabase client, and exports small helper values that other files can use.

## `base44Client.js`

This is a temporary compatibility bridge.

Many app files still call `base44.entities`, `base44.auth`, or `base44.functions`. Instead of changing the whole app at once, this bridge keeps those old calls working while we move the app to Supabase step by step.

Beginner version: `supabaseClient.js` is the new real connection. `base44Client.js` is the adapter that helps the old code talk to the new setup.
