# Database Structure — JASS

> Updated: 2026-06-03  
> DB: Supabase (PostgreSQL)  
> Multi-tenant: แต่ละ `company_id` แยก data อิสระ

---

## Entity Relationship Overview

```
companies
  │
  ├──< employees          (company_id FK)
  │       │
  │       └──< attendance (employee_id FK, period_id FK)
  │
  ├──< periods            (company_id FK)
  │       │
  │       └──< attendance (period_id FK)
  │
  ├──< tasks              (company_id FK)
  │       │
  │       └──< task_images (task_id FK)
  │
  └──< line_users         (company_id FK, nullable)
```

---

## Tables

### `companies` — Tenant หลัก

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `company_id` | int (identity) | PK | |
| `name` | text | NOT NULL | ชื่อบริษัท เช่น "JASS" |
| `created_at` | timestamptz | NOT NULL, default now() | |

---

### `employees` — พนักงาน

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `employee_id` | int (identity) | PK | |
| `company_id` | int | NOT NULL, FK → companies | tenant key |
| `first_name` | text | NOT NULL | |
| `last_name` | text | NOT NULL | |
| `wage` | numeric(10,2) | NOT NULL, >= 0 | ค่าแรงรายวัน |
| `ot_rate` | numeric(10,2) | NOT NULL, >= 0 | ค่า OT ต่อชั่วโมง |
| `is_active` | boolean | NOT NULL, default true | soft delete |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | auto-update via trigger |

**Indexes:** `(company_id)`  
**Trigger:** `employees_updated_at` — set `updated_at = now()` before update

---

### `periods` — งวดเงินเดือน

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `period_id` | int (identity) | PK | |
| `company_id` | int | NOT NULL, FK → companies | tenant key |
| `start_date` | date | NOT NULL | |
| `end_date` | date | NOT NULL | |
| `is_active` | boolean | NOT NULL, default true | งวดที่ใช้งานอยู่ |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Check:** `end_date >= start_date`  
**Indexes:** `(company_id)`

---

### `attendance` — บันทึกการมาทำงานรายวัน

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `attendance_id` | int (identity) | PK | |
| `attendance_date` | date | NOT NULL | วันที่บันทึก (UTC+7) |
| `employee_id` | int | NOT NULL, FK → employees | |
| `period_id` | int | NOT NULL, FK → periods | |
| `morning_check` | boolean | NOT NULL, default false | เช้ามาหรือไม่ |
| `afternoon_check` | boolean | NOT NULL, default false | บ่ายมาหรือไม่ |
| `ot` | double precision | NOT NULL, default 0, >= 0 | ชั่วโมง OT |
| `leave_reason` | text | nullable | เหตุผลการลา |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Unique:** `(attendance_date, employee_id, period_id)` — 1 record ต่อพนักงานต่อวัน  
**Note:** `attendance_date` เป็น local date (UTC+7) ไม่ใช่ UTC

---

### `tasks` — งานประจำวัน

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `task_id` | int (identity) | PK | |
| `company_id` | int | NOT NULL, FK → companies | tenant key |
| `task_date` | date | NOT NULL | วันที่ทำงาน |
| `task` | text | NOT NULL | ชื่องาน |
| `detail` | text | nullable | รายละเอียด |
| `employee_ids` | text | NOT NULL | JSON array of employee_id (denormalized) |
| `start_time` | text | nullable | เวลาเริ่ม เช่น "08:00" |
| `end_time` | text | nullable | เวลาเสร็จ เช่น "17:00" |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Indexes:** `(company_id)`  
**Design Note:** `employee_ids` เก็บเป็น text (JSON array) — ไม่ใช่ FK ปกติ เป็น denormalized list

---

### `task_images` — รูปภาพที่แนบกับงาน

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `image_id` | int (identity) | PK | |
| `task_id` | int | NOT NULL, FK → tasks ON DELETE CASCADE | |
| `file_name` | text | NOT NULL | ชื่อไฟล์ต้นฉบับ |
| `public_url` | text | NOT NULL | URL สำหรับแสดงผล |
| `storage_path` | text | NOT NULL | path ใน Supabase Storage |
| `module` | int | NOT NULL, default 1 | reserved สำหรับแยกประเภทรูป |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Cascade:** ลบ task → ลบ task_images ทั้งหมด

---

### `line_users` — ผู้ใช้ LINE Platform

| Column | Type | Constraint | หมายเหตุ |
|---|---|---|---|
| `user_id` | int (identity) | PK | |
| `line_user_id` | text | NOT NULL, UNIQUE | LINE UID จาก platform |
| `company_id` | int | nullable, FK → companies | ตั้งค่า manually หลัง follow |
| `role` | text | NOT NULL, default 'user' | `'admin'` หรือ `'user'` |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Check:** `role IN ('admin', 'user')`  
**Indexes:** `(company_id)`  
**Note:** `company_id` nullable — user ที่ยังไม่ได้ผูกกับบริษัทใด

---

## Relations Summary

| FK | From | To | Type |
|---|---|---|---|
| `company_id` | employees | companies | N:1 |
| `company_id` | periods | companies | N:1 |
| `company_id` | tasks | companies | N:1 |
| `company_id` | line_users | companies | N:1 (nullable) |
| `employee_id` | attendance | employees | N:1 |
| `period_id` | attendance | periods | N:1 |
| `task_id` | task_images | tasks | N:1 (cascade delete) |

---

## Migrations

| File | เนื้อหา |
|---|---|
| `0001_init_schema.sql` | init employees, periods, attendance, tasks |
| `0002_rebuild_schema.sql` | rebuild + เพิ่ม `is_active` ใน periods |
| `0003_task_images.sql` | เพิ่ม `image_urls[]` ใน tasks |
| `0004_task_images_table.sql` | สร้าง `task_images` table + ลบ `image_urls` column |
| `0005_task_times.sql` | เพิ่ม `start_time`, `end_time` ใน tasks |
| `0006_attendance_leave_reason.sql` | เพิ่ม `leave_reason` ใน attendance |
| `0007_multi_tenant.sql` | เพิ่ม `companies`, `line_users` + backfill `company_id` ทุก table |
