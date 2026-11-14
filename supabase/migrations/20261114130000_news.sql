-- Hírek: globális cikk-gyorsítótár (a fetch-news Edge Function tölti fel,
-- service_role kulccsal, RLS-t megkerülve) + családtagonkénti érdeklődési
-- kör (melyik kategóriákat szeretné látni az adott tag).

create table news_articles (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  category text not null,
  title text not null,
  link text not null,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique (source, link)
);

create index news_articles_category_idx on news_articles(category, published_at desc);

alter table news_articles enable row level security;

-- Nincs insert/update/delete policy a végfelhasználóknak - csak a
-- service_role kulcsos Edge Function írhat bele (az megkerüli az RLS-t).
create policy news_articles_select on news_articles
  for select using (auth.uid() is not null);

create table member_news_interests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references household_members(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  unique (member_id, category)
);

create index member_news_interests_member_id_idx on member_news_interests(member_id);

alter table member_news_interests enable row level security;

create policy member_news_interests_select on member_news_interests
  for select using (
    exists (select 1 from household_members hm where hm.id = member_news_interests.member_id and hm.user_id = auth.uid())
  );

create policy member_news_interests_insert on member_news_interests
  for insert with check (
    exists (select 1 from household_members hm where hm.id = member_news_interests.member_id and hm.user_id = auth.uid())
  );

create policy member_news_interests_delete on member_news_interests
  for delete using (
    exists (select 1 from household_members hm where hm.id = member_news_interests.member_id and hm.user_id = auth.uid())
  );
