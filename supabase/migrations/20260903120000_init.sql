-- Fretwise schema. RLS on every table: auth.uid() = user_id (or profiles.id).
-- Anon key is safe in the SPA only because of these policies.
-- Never grant the service role to the frontend.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  lesson_id text,
  step_index integer not null default 0
);

create table public.attempts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  step_id text not null,
  started_at timestamptz not null,
  duration_seconds double precision not null,
  tempo_bpm integer not null,
  pattern_id text not null,
  chords text[] not null default '{}',
  mean_offset double precision,
  offset_stdev double precision,
  mean_offset_down double precision,
  mean_offset_up double precision,
  stdev_down double precision,
  stdev_up double precision,
  grid_positions_expected integer not null default 0,
  grid_positions_hit integer not null default 0,
  extra_onsets integer not null default 0,
  drift_slope double precision,
  changes_attempted integer not null default 0,
  changes_clean integer not null default 0,
  raw_offsets double precision[] not null default '{}',
  change_latencies double precision[] not null default '{}',
  note text
);

create index attempts_user_started_idx on public.attempts (user_id, started_at desc);
create index attempts_user_lesson_idx on public.attempts (user_id, lesson_id);

create table public.chord_pair_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  from_chord text not null,
  to_chord text not null,
  attempts integer not null default 0,
  best_latency_ms double precision,
  median_latency_ms double precision,
  last_practiced_at timestamptz,
  latencies double precision[] not null default '{}',
  primary key (user_id, from_chord, to_chord)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  duration_seconds double precision,
  note text
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  step_index integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.chord_pair_stats enable row level security;
alter table public.sessions enable row level security;
alter table public.lesson_progress enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "attempts_own" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chord_pair_stats_own" on public.chord_pair_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_own" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lesson_progress_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.attempts to authenticated;
grant select, insert, update, delete on public.chord_pair_stats to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

create policy "recordings_own_select"
  on storage.objects for select
  using (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "recordings_own_insert"
  on storage.objects for insert
  with check (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "recordings_own_update"
  on storage.objects for update
  using (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "recordings_own_delete"
  on storage.objects for delete
  using (bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]);
