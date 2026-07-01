-- Read-only view that enriches posts with fresh profile and community data.
-- Writes still go to the posts table directly.
CREATE OR REPLACE VIEW posts_feed_view AS
SELECT
  p.*,
  pr.display_name   AS profile_display_name,
  pr.avatar_url     AS profile_avatar_url,
  c.name            AS community_name_fresh,
  c.logo_url        AS community_logo_fresh
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN communities c ON c.id = p.community_id;
