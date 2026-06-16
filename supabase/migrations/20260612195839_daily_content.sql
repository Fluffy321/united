create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  mitzvah_text text not null,
  torah_text text not null,
  created_at timestamptz not null default now()
);

alter table public.daily_content enable row level security;

drop policy if exists "Daily content is publicly readable" on public.daily_content;
create policy "Daily content is publicly readable"
  on public.daily_content
  for select
  using (true);

drop policy if exists "Admins can insert daily content" on public.daily_content;
create policy "Admins can insert daily content"
  on public.daily_content
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update daily content" on public.daily_content;
create policy "Admins can update daily content"
  on public.daily_content
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete daily content" on public.daily_content;
create policy "Admins can delete daily content"
  on public.daily_content
  for delete
  to authenticated
  using (public.is_admin());

grant select on public.daily_content to anon, authenticated;
grant insert, update, delete on public.daily_content to authenticated;

insert into public.daily_content (date, mitzvah_text, torah_text)
select
  current_date + day_offset,
  case day_offset % 7
    when 0 then 'Call or message someone who may appreciate being remembered today.'
    when 1 then 'Give tzedakah, even a small amount, before your next errand.'
    when 2 then 'Offer practical help to a neighbor, friend, or family member.'
    when 3 then 'Share a warm greeting with someone you usually pass quickly.'
    when 4 then 'Prepare one thing early that will make Shabbos calmer for someone else.'
    when 5 then 'Thank a teacher, volunteer, parent, or local helper for what they do.'
    else 'Choose one small act of chesed and do it quietly.'
  end,
  case day_offset % 7
    when 0 then 'A day becomes holy when ordinary moments are used for kindness.'
    when 1 then 'Torah asks us to notice the person in front of us, not only the task ahead.'
    when 2 then 'Small mitzvos done consistently can shape the whole atmosphere of a home.'
    when 3 then 'Peace in a community begins with patient words and generous assumptions.'
    when 4 then 'Preparing for Shabbos is also preparing space for gratitude.'
    when 5 then 'Jewish strength is often built through steady, unseen acts of care.'
    else 'Every person can add light to the place where they live.'
  end
from generate_series(0, 13) as day_offset
on conflict (date) do nothing;
