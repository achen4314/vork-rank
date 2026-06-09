-- ============================================================
-- Registration System - Database Migration
-- ============================================================

-- ============================================================
-- 1. Registrations table (athlete self-registration)
-- ============================================================
create table if not exists registrations (
  id            bigint generated always as identity primary key,
  event_slug    text not null references events(slug) on delete cascade,

  -- athlete info
  name          text not null,
  gender        text not null check (gender in ('男','女')),
  id_card       text,
  phone         text not null,
  email         text not null,
  birth_date    date,
  nationality   text default '中国',
  organization  text,
  emergency_name  text,
  emergency_phone text,

  -- registration project
  project       text not null,
  division_hint text,

  -- team info (doubles / team relay)
  team_name     text,
  teammates     jsonb,

  -- status flow
  status        text not null default 'pending',
  status_note   text,

  -- health + waiver
  health_ok     boolean default false,
  waiver_ok     boolean default false,
  medical_note  text,

  -- assignment results (filled by admin)
  bib            text,
  division_code  text,
  wave_label     text,
  start_time     timestamptz,

  -- metadata
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  reviewed_by   uuid,
  reviewed_at   timestamptz,

  unique (event_slug, email, project)
);

alter table registrations
  add constraint registrations_status_check
  check (status in (
    'pending','reviewed','approved','rejected',
    'bib_assigned','wave_assigned','confirmed',
    'checked_in','racing','finished','cancelled'
  ));

create index if not exists registrations_event_status_idx
  on registrations(event_slug, status);
create index if not exists registrations_event_phone_idx
  on registrations(event_slug, phone);
create index if not exists registrations_event_email_idx
  on registrations(event_slug, email);
create index if not exists registrations_event_project_idx
  on registrations(event_slug, project);
create index if not exists registrations_search_trgm_idx
  on registrations using gin ((name || ' ' || phone || ' ' || coalesce(organization, '') || ' ' || coalesce(team_name, '')) gin_trgm_ops);
create index if not exists registrations_bib_idx
  on registrations(event_slug, bib) where bib is not null;

-- ============================================================
-- 2. Waves table (start wave management)
-- ============================================================
create table if not exists waves (
  id              bigint generated always as identity primary key,
  event_slug      text not null references events(slug) on delete cascade,
  wave_label      text not null,
  start_time      timestamptz not null,
  interval_min    integer not null default 3,
  capacity        integer not null,
  enrolled_count  integer default 0,
  project_filter  text[],
  division_filter text[],
  status          text default 'planned',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (event_slug, wave_label)
);

alter table waves
  add constraint waves_status_check
  check (status in ('planned','open','full','closed','finished'));

create index if not exists waves_event_status_idx
  on waves(event_slug, status);

-- ============================================================
-- 3. Email verification codes
-- ============================================================
create table if not exists verification_codes (
  id         bigint generated always as identity primary key,
  email      text not null,
  code       text not null,
  purpose    text not null,
  expires_at timestamptz not null,
  used       boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists verification_email_purpose_idx
  on verification_codes(email, purpose, created_at desc);

-- ============================================================
-- 4. Admins table (requires auth.users)
-- ============================================================
create table if not exists admins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null unique,
  event_slug text references events(slug) on delete cascade,
  role       text not null default 'manager',
  created_at timestamptz not null default now()
);

alter table admins
  add constraint admins_role_check
  check (role in ('super_admin','manager','viewer'));

-- ============================================================
-- 5. Audit logs
-- ============================================================
create table if not exists audit_logs (
  id          bigint generated always as identity primary key,
  event_slug  text not null,
  table_name  text not null,
  record_id   bigint,
  action      text not null,
  old_data    jsonb,
  new_data    jsonb,
  performed_by uuid,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_event_idx
  on audit_logs(event_slug, created_at desc);

-- ============================================================
-- RLS Policies
-- ============================================================

-- registrations
alter table registrations enable row level security;

drop policy if exists "anyone can register" on registrations;
drop policy if exists "athlete read own by email" on registrations;
drop policy if exists "admin manage registrations" on registrations;

create policy "anyone can register" on registrations
  for insert with check (true);

create policy "athlete read own by email" on registrations
  for select using (true);

create policy "admin manage registrations" on registrations
  for all using (
    exists (
      select 1 from admins
      where user_id = auth.uid()
      and (event_slug = registrations.event_slug or event_slug is null)
    )
  );

-- waves
alter table waves enable row level security;

drop policy if exists "public read waves" on waves;
drop policy if exists "admin manage waves" on waves;

create policy "public read waves" on waves for select using (true);

create policy "admin manage waves" on waves
  for all using (
    exists (select 1 from admins where user_id = auth.uid())
  );

-- admins
alter table admins enable row level security;

drop policy if exists "super admin manage admins" on admins;

create policy "super admin manage admins" on admins
  for all using (
    exists (select 1 from admins a2 where a2.user_id = auth.uid() and a2.role = 'super_admin')
  );

-- audit_logs
alter table audit_logs enable row level security;

drop policy if exists "admin read audit" on audit_logs;

create policy "admin read audit" on audit_logs
  for select using (
    exists (select 1 from admins where user_id = auth.uid())
  );
