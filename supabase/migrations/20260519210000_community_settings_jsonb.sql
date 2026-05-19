-- Add flexible settings JSON column to communities table
alter table communities
  add column if not exists settings jsonb default '{}'::jsonb;

-- Add community_type column (key-based type reference)
alter table communities
  add column if not exists community_type text;

-- Add posting_mode column if it doesn't exist (may already exist from 20260515182824)
alter table communities
  add column if not exists posting_mode text default 'open';
