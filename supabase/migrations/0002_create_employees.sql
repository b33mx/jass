create table employees (
  id          int generated always as identity primary key,
  first_name  text        not null,
  last_name   text        not null,
  wage        numeric(10,2) not null check (wage >= 0),  -- บาท/วัน
  ot_rate     numeric(10,2) not null check (ot_rate >= 0),  -- บาท/ชม.
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- auto-update updated_at
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
