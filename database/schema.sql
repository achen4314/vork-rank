create extension if not exists pg_trgm;

create table if not exists events (
  slug text primary key,
  name text not null,
  event_date text,
  venue text,
  timezone text not null default 'Asia/Shanghai',
  source_updated_at timestamptz not null default now()
);

create table if not exists result_entries (
  id bigint generated always as identity primary key,
  event_slug text not null references events(slug) on delete cascade,
  division_code text not null,
  division_name text not null,
  group_name text not null,
  project_name text not null,
  bib text not null,
  display_name text not null,
  team_name text,
  school text,
  gender text,
  raw_rank integer,
  final_rank integer,
  status text not null default 'FINISHED',
  net_time_ms bigint,
  cumulative_penalty_ms bigint not null default 0,
  applied_penalty_ms bigint not null default 0,
  final_time_ms bigint,
  net_time_text text,
  cumulative_penalty_text text,
  applied_penalty_text text,
  final_time_text text,
  penalty_status text,
  note text,
  source_row integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_slug, division_code, bib)
);

create table if not exists split_entries (
  id bigint generated always as identity primary key,
  event_slug text not null,
  division_code text not null,
  bib text not null,
  split_key text not null,
  split_label text not null,
  split_order integer not null,
  split_time_ms bigint,
  split_time_text text,
  created_at timestamptz not null default now(),
  foreign key (event_slug, division_code, bib)
    references result_entries(event_slug, division_code, bib)
    on delete cascade,
  unique (event_slug, division_code, bib, split_key)
);

create index if not exists result_entries_event_rank_idx
  on result_entries(event_slug, division_code, final_rank nulls last, final_time_ms nulls last);
create index if not exists result_entries_search_trgm_idx
  on result_entries using gin ((bib || ' ' || display_name || ' ' || coalesce(school, '') || ' ' || coalesce(team_name, '')) gin_trgm_ops);
create index if not exists split_entries_result_idx
  on split_entries(event_slug, division_code, bib, split_order);

alter table events enable row level security;
alter table result_entries enable row level security;
alter table split_entries enable row level security;

drop policy if exists "public read events" on events;
drop policy if exists "public read result entries" on result_entries;
drop policy if exists "public read split entries" on split_entries;

create policy "public read events" on events for select using (true);
create policy "public read result entries" on result_entries for select using (true);
create policy "public read split entries" on split_entries for select using (true);
