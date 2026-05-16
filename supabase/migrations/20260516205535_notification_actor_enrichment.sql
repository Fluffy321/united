ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_display_name text,
  ADD COLUMN IF NOT EXISTS actor_avatar_url    text;

COMMENT ON COLUMN notifications.actor_display_name IS 'Denormalized actor name snapshot at notification insert time';
COMMENT ON COLUMN notifications.actor_avatar_url   IS 'Denormalized actor avatar URL snapshot at notification insert time';
