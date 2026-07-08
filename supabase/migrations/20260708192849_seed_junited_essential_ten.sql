-- Seed the ten durable Five Towns rooms used by Communities Discover.
-- Idempotent by normalized name so this can run safely against existing data.
with essential_rooms(name, type, description, location) as (
  values
    ('Five Towns Talk', 'Neighborhood', 'Local questions, updates, recommendations, alerts, and neighbor-to-neighbor help.', 'Five Towns'),
    ('Who''s Playing Tonight', 'Sports', 'Pickup games, open teams, workout partners, and plans for tonight.', 'Five Towns'),
    ('Shabbos Plans', 'Shabbos', 'Meals, hosts, guests, zmanim, rides, and practical preparation before Shabbos.', 'Five Towns'),
    ('Minyan & Shul Updates', 'Shul', 'Minyan help, shiurim, kiddush updates, lost items, and shul rides.', 'Five Towns'),
    ('Chesed Opportunities', 'Chesed', 'Open needs, volunteer opportunities, and completed mitzvahs across the Five Towns.', 'Five Towns'),
    ('Kosher Food & Lunch Spots', 'Food', 'Current kosher recommendations, openings, specials, and trusted local food discussion.', 'Five Towns'),
    ('Rides & Carpools', 'Travel', 'School carpools, airport rides, appointments, errands, and last-minute local pickups.', 'Five Towns'),
    ('Events This Week', 'Events', 'Shiurim, school programs, meetups, simchas, and family events happening soon.', 'Five Towns'),
    ('Jobs & Business', 'Business', 'Local jobs, referrals, side work, professional questions, and Jewish-owned businesses.', 'Five Towns'),
    ('Teens Hangout', 'Youth', 'Moderated local plans, sports, school discussion, rides, and shared interests for teens.', 'Five Towns')
)
insert into public.communities (name, type, description, location, follower_count)
select room.name, room.type, room.description, room.location, 0
from essential_rooms room
where not exists (
  select 1
  from public.communities existing
  where lower(trim(existing.name)) = lower(trim(room.name))
);
