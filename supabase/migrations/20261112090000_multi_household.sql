-- Több háztartás egy felhasználónak + váltás köztük.
--
-- Eddig egy user pontosan egy háztartás tagja lehetett (household_members.user_id
-- unique), és minden RLS szabály a my_household_id()-ra épült. Mostantól egy user
-- több háztartásban is lehet tag; a my_household_id() az "aktív" háztartást adja
-- vissza (user_active_household), így az összes meglévő RLS szabály változatlanul
-- az éppen kiválasztott háztartásra szűr. Váltás: set_active_household().

-- 1) Tagság: user_id helyett (household_id, user_id) egyedi
alter table household_members drop constraint household_members_user_id_key;
alter table household_members add constraint household_members_household_user_key unique (household_id, user_id);
create index household_members_user_id_idx on household_members(user_id);

-- 2) Aktív háztartás tárolása
create table user_active_household (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  updated_at timestamptz not null default now()
);
alter table user_active_household enable row level security;
create policy user_active_household_select on user_active_household
  for select using (user_id = auth.uid());
-- írás csak a set_active_household() függvényen keresztül (security definer)

-- 3) Aktív háztartás: a kiválasztott, ha még tagja; különben a legrégebbi tagsága
create or replace function my_household_id()
returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  hh uuid;
begin
  select a.household_id into hh
    from user_active_household a
    join household_members m on m.household_id = a.household_id and m.user_id = a.user_id
    where a.user_id = auth.uid();
  if hh is not null then
    return hh;
  end if;
  return (select household_id from household_members where user_id = auth.uid()
          order by created_at, id limit 1);
end;
$$;

-- 4) Összekapcsolt háztartások: az AKTÍV háztartás + annak összekapcsolt háztartásai
--    (a többi saját háztartás tagjai ne keveredjenek bele az aktív nézetbe)
create or replace function my_connected_household_ids()
returns setof uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  hh uuid := my_household_id();
begin
  if hh is null then
    return;
  end if;
  return query
    select hh
    union
    select household_b_id from household_links where household_a_id = hh and status = 'accepted'
    union
    select household_a_id from household_links where household_b_id = hh and status = 'accepted';
end;
$$;

-- 5) Saját háztartások listája (a váltóhoz)
create or replace function my_households()
returns table (household_id uuid, name text, member_id uuid, role text, is_active boolean)
language sql stable security definer set search_path = public
as $$
  select h.id, h.name, m.id, m.role, h.id = my_household_id()
    from household_members m
    join households h on h.id = m.household_id
    where m.user_id = auth.uid()
    order by m.created_at, m.id;
$$;

-- 6) Váltás
create or replace function set_active_household(p_household_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from household_members where user_id = auth.uid() and household_id = p_household_id) then
    raise exception 'Nem vagy tagja ennek a háztartásnak';
  end if;
  insert into user_active_household (user_id, household_id, updated_at)
    values (auth.uid(), p_household_id, now())
    on conflict (user_id) do update set household_id = excluded.household_id, updated_at = now();
end;
$$;

-- 7) Létrehozás: már meglévő tagság mellett is lehet; az új lesz az aktív
create or replace function create_household(p_name text, p_display_name text, p_avatar_color text)
returns household_members
language plpgsql security definer set search_path = public
as $$
declare
  new_household households%rowtype;
  new_member household_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Nincs bejelentkezve';
  end if;

  insert into households (name) values (p_name) returning * into new_household;

  insert into household_members (household_id, user_id, display_name, avatar_color, role)
  values (new_household.id, auth.uid(), p_display_name, p_avatar_color, 'owner')
  returning * into new_member;

  perform set_active_household(new_household.id);
  return new_member;
end;
$$;

-- 8) Csatlakozás meghívóval: csak ugyanabba a háztartásba nem lehet kétszer; az új lesz az aktív
create or replace function redeem_member_invite(invite_code text, p_display_name text, p_avatar_color text)
returns household_members
language plpgsql security definer set search_path = public
as $$
declare
  inv invites%rowtype;
  new_member household_members%rowtype;
begin
  select * into inv from invites
    where code = upper(invite_code) and kind = 'member' and redeemed_at is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then
    raise exception 'Érvénytelen vagy lejárt meghívó kód';
  end if;

  if exists (select 1 from household_members where user_id = auth.uid() and household_id = inv.household_id) then
    raise exception 'Már tagja vagy ennek a háztartásnak';
  end if;

  insert into household_members (household_id, user_id, display_name, avatar_color, role)
  values (inv.household_id, auth.uid(), p_display_name, p_avatar_color, 'member')
  returning * into new_member;

  update invites set redeemed_by_user_id = auth.uid(), redeemed_at = now() where id = inv.id;

  perform set_active_household(inv.household_id);
  return new_member;
end;
$$;

-- 9) Meghívó létrehozása / háztartás-összekapcsolás: az aktív háztartás nevében
create or replace function create_invite(p_kind text, p_expires_in_hours int default 168)
returns invites
language plpgsql security definer set search_path = public
as $$
declare
  my_hh uuid := my_household_id();
  new_invite invites%rowtype;
  new_code text;
begin
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

create or replace function redeem_household_link_invite(invite_code text)
returns household_links
language plpgsql security definer set search_path = public
as $$
declare
  inv invites%rowtype;
  my_hh uuid := my_household_id();
  new_link household_links%rowtype;
begin
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

grant execute on function my_households() to authenticated;
grant execute on function set_active_household(uuid) to authenticated;
