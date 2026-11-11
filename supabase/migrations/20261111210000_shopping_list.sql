-- Közös bevásárlólista: bárki felvehet egy tételt, bárki kipipálhatja.
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  checked boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index shopping_items_household_id_idx on shopping_items(household_id);

alter table shopping_items enable row level security;

create policy shopping_items_all on shopping_items
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());
