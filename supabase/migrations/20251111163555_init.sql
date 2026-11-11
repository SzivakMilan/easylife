-- Otthon - kezdeti séma: háztartások, tagság, meghívók, összekapcsolt háztartások,
-- határidők/időpontok/számlák (felelősökkel és extra megosztással), költségvetés.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Háztartások és tagság
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#60a5fa',
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

create index household_members_household_id_idx on household_members(household_id);

-- Egységes meghívó tábla: 'member' = új tag csatlakozik a háztartáshoz,
-- 'household_link' = egy másik háztartás admin tagja összekapcsolja a sajátjával.
create table invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  kind text not null check (kind in ('member', 'household_link')),
  code text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz,
  redeemed_by_user_id uuid references auth.users(id),
  redeemed_by_household_id uuid references households(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_household_id_idx on invites(household_id);

create table household_links (
  id uuid primary key default gen_random_uuid(),
  household_a_id uuid not null references households(id) on delete cascade,
  household_b_id uuid not null references households(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint household_links_distinct check (household_a_id <> household_b_id),
  constraint household_links_unique unique (household_a_id, household_b_id)
);

-- ---------------------------------------------------------------------------
-- Segédfüggvények (RLS-hez és RPC-khez)
-- ---------------------------------------------------------------------------

create or replace function my_household_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid() limit 1;
$$;

create or replace function my_connected_household_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid()
  union
  select household_b_id from household_links
    where household_a_id = (select household_id from household_members where user_id = auth.uid())
    and status = 'accepted'
  union
  select household_a_id from household_links
    where household_b_id = (select household_id from household_members where user_id = auth.uid())
    and status = 'accepted';
$$;

-- ---------------------------------------------------------------------------
-- Háztartás és tagság RPC-k (meghívó kódok beváltása, háztartás létrehozása)
-- ---------------------------------------------------------------------------

create or replace function create_household(p_name text, p_display_name text, p_avatar_color text)
returns household_members
language plpgsql security definer set search_path = public as $$
declare
  new_household households%rowtype;
  new_member household_members%rowtype;
begin
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'Már tagja vagy egy háztartásnak';
  end if;

  insert into households (name) values (p_name) returning * into new_household;

  insert into household_members (household_id, user_id, display_name, avatar_color, role)
  values (new_household.id, auth.uid(), p_display_name, p_avatar_color, 'owner')
  returning * into new_member;

  return new_member;
end;
$$;

create or replace function create_invite(p_kind text, p_expires_in_hours int default 168)
returns invites
language plpgsql security definer set search_path = public as $$
declare
  my_hh uuid;
  new_invite invites%rowtype;
  new_code text;
begin
  select household_id into my_hh from household_members where user_id = auth.uid();
  if my_hh is null then
    raise exception 'Nincs háztartásod';
  end if;
  if p_kind not in ('member', 'household_link') then
    raise exception 'Érvénytelen meghívó típus';
  end if;

  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into invites (household_id, kind, code, created_by, expires_at)
  values (my_hh, p_kind, new_code, auth.uid(), now() + make_interval(hours => p_expires_in_hours))
  returning * into new_invite;

  return new_invite;
end;
$$;

create or replace function redeem_member_invite(invite_code text, p_display_name text, p_avatar_color text)
returns household_members
language plpgsql security definer set search_path = public as $$
declare
  inv invites%rowtype;
  new_member household_members%rowtype;
begin
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'Már tagja vagy egy háztartásnak';
  end if;

  select * into inv from invites
    where code = upper(invite_code) and kind = 'member' and redeemed_at is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then
    raise exception 'Érvénytelen vagy lejárt meghívó kód';
  end if;

  insert into household_members (household_id, user_id, display_name, avatar_color, role)
  values (inv.household_id, auth.uid(), p_display_name, p_avatar_color, 'member')
  returning * into new_member;

  update invites set redeemed_by_user_id = auth.uid(), redeemed_at = now() where id = inv.id;

  return new_member;
end;
$$;

create or replace function redeem_household_link_invite(invite_code text)
returns household_links
language plpgsql security definer set search_path = public as $$
declare
  inv invites%rowtype;
  my_hh uuid;
  new_link household_links%rowtype;
begin
  select household_id into my_hh from household_members where user_id = auth.uid();
  if my_hh is null then
    raise exception 'Nincs háztartásod';
  end if;

  select * into inv from invites
    where code = upper(invite_code) and kind = 'household_link' and redeemed_at is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then
    raise exception 'Érvénytelen vagy lejárt meghívó kód';
  end if;

  if inv.household_id = my_hh then
    raise exception 'Nem kapcsolhatod össze a háztartást saját magával';
  end if;

  insert into household_links (household_a_id, household_b_id, status, created_by)
  values (inv.household_id, my_hh, 'accepted', auth.uid())
  on conflict (household_a_id, household_b_id) do nothing
  returning * into new_link;

  update invites set redeemed_by_household_id = my_hh, redeemed_at = now() where id = inv.id;

  return new_link;
end;
$$;

-- ---------------------------------------------------------------------------
-- Határidők
-- ---------------------------------------------------------------------------

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  due_time time,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  recurrence text not null default 'none' check (recurrence in ('none', 'weekly', 'monthly', 'yearly')),
  done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index deadlines_household_id_idx on deadlines(household_id);

create table deadline_assignees (
  deadline_id uuid not null references deadlines(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (deadline_id, member_id)
);

create table deadline_viewers (
  deadline_id uuid not null references deadlines(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (deadline_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Időpontok
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  note text,
  reminder_offset_minutes int,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index events_household_id_idx on events(household_id);

create table event_participants (
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (event_id, member_id)
);

create table event_viewers (
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (event_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Költségvetés
-- ---------------------------------------------------------------------------

create table budget_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  monthly_limit numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index budget_categories_household_id_idx on budget_categories(household_id);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references budget_categories(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12, 2) not null,
  note text,
  occurred_on date not null,
  source_bill_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index budget_items_household_id_idx on budget_items(household_id);
create index budget_items_category_id_idx on budget_items(category_id);

-- ---------------------------------------------------------------------------
-- Számlák
-- ---------------------------------------------------------------------------

create table bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  issuer text not null,
  amount numeric(12, 2) not null,
  due_date date not null,
  category_id uuid references budget_categories(id),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at date,
  recurrence text not null default 'none' check (recurrence in ('none', 'weekly', 'monthly', 'yearly')),
  file_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index bills_household_id_idx on bills(household_id);

alter table budget_items
  add constraint budget_items_source_bill_fk foreign key (source_bill_id) references bills(id) on delete set null;

create table bill_viewers (
  bill_id uuid not null references bills(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (bill_id, member_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table invites enable row level security;
alter table household_links enable row level security;
alter table deadlines enable row level security;
alter table deadline_assignees enable row level security;
alter table deadline_viewers enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table event_viewers enable row level security;
alter table budget_categories enable row level security;
alter table budget_items enable row level security;
alter table bills enable row level security;
alter table bill_viewers enable row level security;

-- households: csak a saját háztartásod sorát látod; létrehozás a create_household() RPC-n keresztül
-- (security definer), közvetlen insert a táblára nincs engedélyezve a kliensnek.
create policy households_select on households
  for select using (id in (select my_connected_household_ids()));

-- household_members: a sajátod és az összekapcsolt háztartásokét látod (megosztás-választóhoz).
create policy household_members_select on household_members
  for select using (household_id in (select my_connected_household_ids()));
create policy household_members_update_self on household_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- invites: csak a saját háztartásod meghívóit látod/hozod létre.
create policy invites_select on invites
  for select using (household_id = my_household_id());

-- household_links: a sajátodhoz kapcsolódókat látod.
create policy household_links_select on household_links
  for select using (household_a_id = my_household_id() or household_b_id = my_household_id());

-- deadlines
create policy deadlines_select on deadlines
  for select using (
    household_id = my_household_id()
    or exists (
      select 1 from deadline_viewers dv
      join household_members hm on hm.id = dv.member_id
      where dv.deadline_id = deadlines.id and hm.user_id = auth.uid()
    )
  );
create policy deadlines_insert on deadlines
  for insert with check (household_id = my_household_id());
create policy deadlines_update on deadlines
  for update using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy deadlines_delete on deadlines
  for delete using (household_id = my_household_id());

create policy deadline_assignees_select on deadline_assignees
  for select using (exists (
    select 1 from deadlines d where d.id = deadline_assignees.deadline_id and d.household_id = my_household_id()
  ));
create policy deadline_assignees_write on deadline_assignees
  for all using (exists (
    select 1 from deadlines d where d.id = deadline_assignees.deadline_id and d.household_id = my_household_id()
  )) with check (exists (
    select 1 from deadlines d where d.id = deadline_assignees.deadline_id and d.household_id = my_household_id()
  ));

create policy deadline_viewers_select on deadline_viewers
  for select using (
    exists (select 1 from deadlines d where d.id = deadline_viewers.deadline_id and d.household_id = my_household_id())
    or exists (
      select 1 from household_members hm where hm.id = deadline_viewers.member_id and hm.user_id = auth.uid()
    )
  );
create policy deadline_viewers_write on deadline_viewers
  for all using (exists (
    select 1 from deadlines d where d.id = deadline_viewers.deadline_id and d.household_id = my_household_id()
  )) with check (exists (
    select 1 from deadlines d where d.id = deadline_viewers.deadline_id and d.household_id = my_household_id()
  ));

-- events
create policy events_select on events
  for select using (
    household_id = my_household_id()
    or exists (
      select 1 from event_viewers ev
      join household_members hm on hm.id = ev.member_id
      where ev.event_id = events.id and hm.user_id = auth.uid()
    )
  );
create policy events_insert on events
  for insert with check (household_id = my_household_id());
create policy events_update on events
  for update using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy events_delete on events
  for delete using (household_id = my_household_id());

create policy event_participants_select on event_participants
  for select using (exists (
    select 1 from events e where e.id = event_participants.event_id and e.household_id = my_household_id()
  ));
create policy event_participants_write on event_participants
  for all using (exists (
    select 1 from events e where e.id = event_participants.event_id and e.household_id = my_household_id()
  )) with check (exists (
    select 1 from events e where e.id = event_participants.event_id and e.household_id = my_household_id()
  ));

create policy event_viewers_select on event_viewers
  for select using (
    exists (select 1 from events e where e.id = event_viewers.event_id and e.household_id = my_household_id())
    or exists (
      select 1 from household_members hm where hm.id = event_viewers.member_id and hm.user_id = auth.uid()
    )
  );
create policy event_viewers_write on event_viewers
  for all using (exists (
    select 1 from events e where e.id = event_viewers.event_id and e.household_id = my_household_id()
  )) with check (exists (
    select 1 from events e where e.id = event_viewers.event_id and e.household_id = my_household_id()
  ));

-- budget (nincs extra megosztás, csak a saját háztartás)
create policy budget_categories_all on budget_categories
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy budget_items_all on budget_items
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());

-- bills
create policy bills_select on bills
  for select using (
    household_id = my_household_id()
    or exists (
      select 1 from bill_viewers bv
      join household_members hm on hm.id = bv.member_id
      where bv.bill_id = bills.id and hm.user_id = auth.uid()
    )
  );
create policy bills_insert on bills
  for insert with check (household_id = my_household_id());
create policy bills_update on bills
  for update using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy bills_delete on bills
  for delete using (household_id = my_household_id());

create policy bill_viewers_select on bill_viewers
  for select using (
    exists (select 1 from bills b where b.id = bill_viewers.bill_id and b.household_id = my_household_id())
    or exists (
      select 1 from household_members hm where hm.id = bill_viewers.member_id and hm.user_id = auth.uid()
    )
  );
create policy bill_viewers_write on bill_viewers
  for all using (exists (
    select 1 from bills b where b.id = bill_viewers.bill_id and b.household_id = my_household_id()
  )) with check (exists (
    select 1 from bills b where b.id = bill_viewers.bill_id and b.household_id = my_household_id()
  ));
