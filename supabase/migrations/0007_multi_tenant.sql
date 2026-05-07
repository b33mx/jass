-- companies
create table companies (
  company_id  int generated always as identity primary key,
  name        text        not null,
  created_at  timestamptz not null default now()
);

-- line_users: LINE platform users, company_id set manually after follow
create table line_users (
  user_id       int generated always as identity primary key,
  line_user_id  text        not null unique,
  company_id    int         references companies(company_id),
  role          text        not null default 'user' check (role in ('admin', 'user')),
  created_at    timestamptz not null default now()
);

-- insert default company for existing data
insert into companies (name) values ('JASS');

-- add company_id to existing tables (nullable first for backfill)
alter table employees add column company_id int references companies(company_id);
alter table periods    add column company_id int references companies(company_id);
alter table tasks      add column company_id int references companies(company_id);

-- backfill existing rows to company_id = 1
update employees set company_id = 1;
update periods    set company_id = 1;
update tasks      set company_id = 1;

-- enforce not null after backfill
alter table employees alter column company_id set not null;
alter table periods    alter column company_id set not null;
alter table tasks      alter column company_id set not null;

-- index for common tenant-scoped queries
create index on employees (company_id);
create index on periods    (company_id);
create index on tasks      (company_id);
create index on line_users (company_id);
