-- Eddig tételenként pontosan egyszer lehetett emlékeztetőt kapni (egyetlen
-- reminder_offset_minutes érték + notified_at egyszeri jelző). Mostantól
-- egy tételhez TÖBB emlékeztető-időpont is választható (pl. "1 nappal előtte"
-- ÉS "1 órával előtte" is), ezért:
--   - reminder_offset_minutes (egyetlen szám) helyett reminder_offsets
--     (egész szám tömb) tárolja a kiválasztott emlékeztetőket.
--   - notified_offsets tömb tárolja, mely konkrét offsetekhez MÁR ment ki
--     push (a notified_at egyetlen időbélyeg helyett/mellett), hogy egy
--     tételhez később, egy másik beállított offsetnél is tudjunk még
--     emlékeztetőt küldeni.
alter table deadlines add column reminder_offsets integer[] not null default '{}';
alter table events add column reminder_offsets integer[] not null default '{}';
alter table bills add column reminder_offsets integer[] not null default '{}';

update deadlines set reminder_offsets = array[reminder_offset_minutes] where reminder_offset_minutes is not null;
update events set reminder_offsets = array[reminder_offset_minutes] where reminder_offset_minutes is not null;
update bills set reminder_offsets = array[reminder_offset_minutes] where reminder_offset_minutes is not null;

alter table deadlines drop column reminder_offset_minutes;
alter table events drop column reminder_offset_minutes;
alter table bills drop column reminder_offset_minutes;

alter table deadlines add column notified_offsets integer[] not null default '{}';
alter table events add column notified_offsets integer[] not null default '{}';
alter table bills add column notified_offsets integer[] not null default '{}';
