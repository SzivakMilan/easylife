-- Megtakarítási célok: "mire gyűjtesz" (cél összeg) + "mennyit tettél félre eddig"
-- (a hozzá tartozó befizetések összege, ugyanúgy előzmény-listaként vezetve,
-- mint a budget_items a kiadásoknál/bevételeknél).
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  target_amount numeric(12, 2) not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index savings_goals_household_id_idx on savings_goals(household_id);

create table savings_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  amount numeric(12, 2) not null,
  note text,
  occurred_on date not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index savings_contributions_goal_id_idx on savings_contributions(goal_id);

alter table savings_goals enable row level security;
alter table savings_contributions enable row level security;

create policy savings_goals_all on savings_goals
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());
create policy savings_contributions_all on savings_contributions
  for all using (household_id = my_household_id()) with check (household_id = my_household_id());
