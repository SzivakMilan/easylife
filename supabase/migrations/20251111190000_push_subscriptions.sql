-- Web Push feliratkozások: minden háztartástag készülékenként egy sort kap
-- (ugyanaz a tag több eszközön is feliratkozhat).

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references household_members(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_member_id_idx on push_subscriptions(member_id);

alter table push_subscriptions enable row level security;

create policy push_subscriptions_select on push_subscriptions
  for select using (
    exists (select 1 from household_members hm where hm.id = push_subscriptions.member_id and hm.user_id = auth.uid())
  );

create policy push_subscriptions_insert on push_subscriptions
  for insert with check (
    exists (select 1 from household_members hm where hm.id = push_subscriptions.member_id and hm.user_id = auth.uid())
  );

create policy push_subscriptions_delete on push_subscriptions
  for delete using (
    exists (select 1 from household_members hm where hm.id = push_subscriptions.member_id and hm.user_id = auth.uid())
  );
