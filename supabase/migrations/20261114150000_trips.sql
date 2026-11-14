-- Utazás szervező: egy utazás (cél, dátumok, résztvevők) és a hozzá tartozó
-- csomaglista, közös költség-napló, dokumentum-csatolmányok.

create table trips (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  destination text,
  start_date date not null,
  end_date date,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index trips_household_id_idx on trips(household_id);

create table trip_participants (
  trip_id uuid not null references trips(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  primary key (trip_id, member_id)
);

create table trip_packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  checked boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index trip_packing_items_trip_id_idx on trip_packing_items(trip_id);

create table trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  amount numeric not null,
  note text,
  occurred_on date not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index trip_expenses_trip_id_idx on trip_expenses(trip_id);

create table trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  label text not null,
  file_path text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index trip_documents_trip_id_idx on trip_documents(trip_id);

alter table trips enable row level security;
alter table trip_participants enable row level security;
alter table trip_packing_items enable row level security;
alter table trip_expenses enable row level security;
alter table trip_documents enable row level security;

create policy trips_all on trips
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());

create policy trip_participants_all on trip_participants
  for all using (
    exists (select 1 from trips t where t.id = trip_participants.trip_id and t.household_id = my_household_id())
  ) with check (
    exists (select 1 from trips t where t.id = trip_participants.trip_id and t.household_id = my_household_id())
  );

create policy trip_packing_items_all on trip_packing_items
  for all using (
    exists (select 1 from trips t where t.id = trip_packing_items.trip_id and t.household_id = my_household_id())
  ) with check (
    exists (select 1 from trips t where t.id = trip_packing_items.trip_id and t.household_id = my_household_id())
  );

create policy trip_expenses_all on trip_expenses
  for all using (
    exists (select 1 from trips t where t.id = trip_expenses.trip_id and t.household_id = my_household_id())
  ) with check (
    exists (select 1 from trips t where t.id = trip_expenses.trip_id and t.household_id = my_household_id())
  );

create policy trip_documents_all on trip_documents
  for all using (
    exists (select 1 from trips t where t.id = trip_documents.trip_id and t.household_id = my_household_id())
  ) with check (
    exists (select 1 from trips t where t.id = trip_documents.trip_id and t.household_id = my_household_id())
  );

-- Privát Storage bucket az utazási dokumentumokhoz (jegyek, foglalások),
-- ugyanaz a minta mint a "bills" bucketnél: <household_id>/<trip_id>/<fájlnév>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('trips', 'trips', false, 20971520)
on conflict (id) do nothing;

create policy trips_storage_select on storage.objects
  for select using (
    bucket_id = 'trips' and (storage.foldername(name))[1] = my_household_id()::text
  );

create policy trips_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'trips' and (storage.foldername(name))[1] = my_household_id()::text
  );

create policy trips_storage_delete on storage.objects
  for delete using (
    bucket_id = 'trips' and (storage.foldername(name))[1] = my_household_id()::text
  );
