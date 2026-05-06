# Supabase setup

This folder keeps the database setup for JUnited.

Run these files in Supabase SQL Editor in this order:

1. `migrations/001_core.sql`
2. `migrations/002_messages.sql`
3. `migrations/003_profile_privacy.sql`

What they do:

- `001_core.sql` creates the main app tables: profiles, communities, and posts.
- `002_messages.sql` creates the Messages tables: conversations and messages.
- `003_profile_privacy.sql` separates public profile reads from private account data, including email.
- Both files also turn on basic security rules so users can only write the right kind of data.

The local app already has Supabase enabled through `.env.local`.
