-- Egészség napló: manuálisan rögzített étkezés, ital és testsúly bejegyzések.
create table health_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('food', 'drink', 'weight')),
  amount numeric,
  note text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index health_entries_household_id_idx on health_entries(household_id);
create index health_entries_type_idx on health_entries(type);

alter table health_entries enable row level security;

create policy health_entries_all on health_entries
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());
