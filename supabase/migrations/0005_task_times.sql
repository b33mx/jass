-- add start_time and end_time to tasks
alter table tasks add column start_time text;
alter table tasks add column end_time text;
