create table employee_wage_history (
  id             int generated always as identity primary key,
  employee_id    int           not null references employees(employee_id),
  company_id     int           not null references companies(company_id),
  wage           numeric(10,2) not null check (wage >= 0),
  ot_rate        numeric(10,2) not null check (ot_rate >= 0),
  effective_from date          not null,
  note           text,
  created_at     timestamptz   not null default now(),
  unique (employee_id, effective_from)
);

-- backfill: ใช้ค่าแรงปัจจุบันเป็น record แรกของทุกคน
insert into employee_wage_history (employee_id, company_id, wage, ot_rate, effective_from, note)
select employee_id, company_id, wage, ot_rate, '2020-01-01', 'ข้อมูลเริ่มต้น (backfill)'
from employees;

create index on employee_wage_history (employee_id, effective_from);
