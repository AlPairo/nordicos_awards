-- Enable UUID generation helper
create extension if not exists "pgcrypto";

-- Helper function to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('admin','user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  max_nominees integer not null default 10,
  allow_multiple_votes boolean not null default false,
  voting_enabled boolean not null default true,
  year integer,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_order_idx on public.categories (is_active, display_order);

create trigger categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

create table if not exists public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  filename text not null,
  original_filename text not null,
  file_path text not null,
  media_type text not null check (media_type in ('photo','video')),
  file_size bigint not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  description text,
  admin_notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_uploads_status_idx on public.media_uploads (status, created_at desc);
create index if not exists media_uploads_user_idx on public.media_uploads (user_id);

create trigger media_uploads_updated_at
before update on public.media_uploads
for each row execute procedure public.set_updated_at();

create table if not exists public.nominees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid not null references public.categories(id) on delete cascade,
  image_url text,
  video_url text,
  media_type text not null default 'none' check (media_type in ('image','video','both','none')),
  is_active boolean not null default true,
  display_order integer not null default 0,
  original_filename text,
  file_size bigint,
  mime_type text,
  uploaded_at timestamptz,
  linked_media_id uuid references public.media_uploads(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nominees_category_idx on public.nominees (category_id, is_active, display_order);

create trigger nominees_updated_at
before update on public.nominees
for each row execute procedure public.set_updated_at();

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  nominee_id uuid not null references public.nominees(id) on delete cascade,
  ip_address text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'votes_unique_user_category'
  ) then
    alter table public.votes add constraint votes_unique_user_category unique (user_id, category_id);
  end if;
end $$;

create index if not exists votes_nominee_idx on public.votes (nominee_id);
create index if not exists votes_category_idx on public.votes (category_id);
