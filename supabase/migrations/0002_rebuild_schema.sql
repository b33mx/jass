-- drop old tables if they exist (handles partial old schema)
drop table if exists attendance cascade;
drop table if exists tasks cascade;
drop table if exists periods cascade;
drop table if exists employees cascade;
drop function if exists set_updated_at cascade;

-- employees
create table employees (
  employee_id  int generated always as identity primary key,
  first_name   text          not null,
  last_name    text          not null,
  wage         numeric(10,2) not null check (wage >= 0),
  ot_rate      numeric(10,2) not null check (ot_rate >= 0),
  is_active    boolean       not null default true,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- periods
create table periods (
  period_id   int generated always as identity primary key,
  start_date  date        not null,
  end_date    date        not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  constraint periods_date_check check (end_date >= start_date)
);

-- attendance
create table attendance (
  attendance_id    int generated always as identity primary key,
  attendance_date  date             not null,
  employee_id      int              not null references employees(employee_id),
  period_id        int              not null references periods(period_id),
  morning_check    boolean          not null default false,
  afternoon_check  boolean          not null default false,
  ot               double precision not null default 0 check (ot >= 0),
  created_at       timestamptz      not null default now(),
  constraint attendance_unique unique (attendance_date, employee_id, period_id)
);

-- tasks
create table tasks (
  task_id       int generated always as identity primary key,
  task_date     date        not null,
  task          text        not null,
  detail        text,
  employee_ids  text        not null,
  created_at    timestamptz not null default now()
);
