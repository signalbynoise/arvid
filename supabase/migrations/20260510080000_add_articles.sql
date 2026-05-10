-- Articles table for the headless CMS (marketing site content)
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  type text not null check (type in ('article', 'feature', 'docs')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  content jsonb not null default '[]'::jsonb,
  excerpt text,
  mini_demo_id text,
  author text,
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_articles_type_status on articles (type, status);

alter table articles enable row level security;

-- Anon users can read published articles only
create policy articles_public_read on articles
  for select
  to anon
  using (status = 'published');

-- Authenticated users have full access (CMS admin via BFF)
create policy articles_authenticated_select on articles
  for select
  to authenticated
  using (true);

create policy articles_authenticated_insert on articles
  for insert
  to authenticated
  with check (true);

create policy articles_authenticated_update on articles
  for update
  to authenticated
  using (true)
  with check (true);

create policy articles_authenticated_delete on articles
  for delete
  to authenticated
  using (true);
