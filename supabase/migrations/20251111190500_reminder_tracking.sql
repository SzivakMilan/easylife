-- Egyszeri emlékeztető küldésének nyilvántartása, hogy a cron job ne küldje el
-- ugyanazt a push értesítést többször.

alter table deadlines add column notified_at timestamptz;
alter table events add column notified_at timestamptz;
alter table bills add column notified_at timestamptz;
