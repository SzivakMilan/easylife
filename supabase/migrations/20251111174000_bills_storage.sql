-- Privát Storage bucket a számla-mellékletekhez (PDF/fotó). Az elérési út konvenciója:
-- <household_id>/<bill_id>/<fájlnév> - az RLS ez alapján az első mappanév (household_id)
-- egyezését ellenőrzi a felhasználó saját háztartásával.

insert into storage.buckets (id, name, public, file_size_limit)
values ('bills', 'bills', false, 20971520)
on conflict (id) do nothing;

create policy bills_storage_select on storage.objects
  for select using (
    bucket_id = 'bills' and (storage.foldername(name))[1] = my_household_id()::text
  );

create policy bills_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'bills' and (storage.foldername(name))[1] = my_household_id()::text
  );

create policy bills_storage_update on storage.objects
  for update using (
    bucket_id = 'bills' and (storage.foldername(name))[1] = my_household_id()::text
  );

create policy bills_storage_delete on storage.objects
  for delete using (
    bucket_id = 'bills' and (storage.foldername(name))[1] = my_household_id()::text
  );
