# JUnited

JUnited is a local community app built with React. It includes pages for feed posts, communities, messages, events, local help, settings, and sign in.

This project used to be connected to Base44. It is now being moved toward Supabase. Some files still use the name `base44` because they are part of a temporary bridge that keeps the app working while the migration happens.

## Main Tech

- React: builds the app screens and components.
- Vite: runs the local development server.
- Tailwind CSS: handles most styling.
- shadcn/ui and Radix UI: reusable UI pieces like buttons, forms, dialogs, and menus.
- React Router: controls page navigation.
- TanStack Query: loads and refreshes app data.
- Supabase: handles the real database and authentication work we are moving toward.

## Main Folders

- `src/pages`: full app screens, like Login, Feed, Messages, and Communities.
- `src/components`: reusable pieces that pages share.
- `src/api`: app connection code. This is where Supabase and the temporary Base44 bridge live.
- `src/lib`: small helper utilities.
- `src/hooks`: reusable React logic.
- `supabase/migrations`: SQL files that create the Supabase database tables and rules.
- `base44/functions`: old Base44 function files. These are kept for reference during the migration.
- `public`: static files like the service worker and manifest.

## Run Locally

From inside this folder:

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Supabase Setup

Create a file named `.env.local` in this project folder.

Use this format:

```bash
VITE_SUPABASE_ENABLED=true
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_AUTH_REDIRECT_URL=http://localhost:5173/login
```

Do not commit `.env.local`. It is for your computer only.

In Supabase, run the SQL files in this order:

```text
supabase/migrations/001_core.sql
supabase/migrations/002_messages.sql
```

The current Supabase tables include:

- `profiles`
- `communities`
- `posts`
- `conversations`
- `messages`

## Important Migration Note

The app still imports `base44` in many places. Right now that name points to a compatibility bridge in:

```text
src/api/base44Client.js
```

That bridge lets old app code keep working while new Supabase code is added slowly and safely.

The real Supabase setup now lives in:

```text
src/api/supabaseClient.js
```

## Useful Commands

```bash
npm run dev
npm run build
```

`npm run build` checks whether the app can be prepared for production.

## What To Test Manually

After changes, test these pages in the browser:

- Login
- Communities
- Messages
- Feed
- Settings

Also test:

- Create account
- Verify email
- Sign in
- Sign out
- Refresh the page after signing in
