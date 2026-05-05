-- add leave reason to attendance records
alter table attendance add column if not exists leave_reason text;
