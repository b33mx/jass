-- add start_time and end_time to tasks
alter table tasks add column if not exists start_time text;
alter table tasks add column if not exists end_time text;
