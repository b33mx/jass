# JASS Payroll LINE OA — Project Context

> Last updated: 2026-05-05 | Phase: Phase 2 — Payroll Core (starting)

## What we're building

ระบบลงเวลางานและคำนวณเงินเดือนผ่าน LINE OA สำหรับบริษัทเดียว (single org) — เสมียนบันทึกเวลา/งานแทนพนักงาน, ระบบคำนวณเงินเดือนให้ทุกงวด, เจ้านายดูรายงานได้

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS 3 + LINE LIFF v2
- **Backend:** Node.js 20 + Express 4 + TypeScript (ESM)
- **Database:** Supabase (PostgreSQL) — ใช้ Supabase JS client ฝั่ง backend ด้วย service_role key
- **Platform:** LINE OA (webhook) + LINE LIFF (mini web app ใน LINE)
- **Monorepo:** npm workspaces (`apps/backend`, `apps/web`)
- **CI/CD:** GitHub Actions (lint + build)
- **Dev tunnel:** ngrok (สำหรับ LINE webhook ในช่วง local dev)
- **Hosting (TBD):** Railway (backend) + Vercel/Netlify (frontend)

## Conventions

- TypeScript strict mode ทั้งสอง app
- Backend เป็น ESM (`"type": "module"`) — import ต้องมี `.ts` extension
- API response format: direct data (ไม่ wrap `{ success, data }`) ตามที่ implement จริง
- DB access ผ่าน repository layer เท่านั้น — ไม่ query Supabase ตรงจาก controller
- Service layer = pure business logic ไม่รู้จัก HTTP/LINE
- Controller layer = รู้จัก HTTP req/res, เรียก service, return JSON
- Handler layer = รู้จัก LINE event, เรียก service, build Flex message
- Timezone: บันทึก UTC ใน DB, แสดงผล Asia/Bangkok (UTC+7)
- **Date string formatting (critical):** ห้ามใช้ `new Date(str).toISOString().slice(0,10)` เพื่อสร้าง `YYYY-MM-DD` string — เพราะถ้า Date object ถูกสร้างด้วย local time (เช่น `new Date(str + 'T00:00:00')`) แล้วแปลงด้วย `toISOString()` จะได้วันที่ผิด 1 วันใน UTC+7
  - ✅ ถูก: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  - ✅ ถูก: `new Date(isoDateOnlyStr)` (parse date-only string = UTC) + `toISOString()` (backend: `attendance.service.ts`)
  - ❌ ผิด: `new Date(str + 'T00:00:00').toISOString().slice(0,10)` (local → UTC mismatch)
- Zod สำหรับ validate ทุก input (API body)

## Decisions Made (ไม่ต้องถามซ้ำ)

- ใช้ Supabase client โดยตรง — ไม่ใช้ Prisma/Drizzle
- LIFF สำหรับ form input ที่ซับซ้อน — ไม่ทำ chat-based multi-step form
- PK ใช้ `int generated always as identity` — ไม่ใช้ UUID (ลด complexity)
- Employee schema ใช้ `first_name`/`last_name` + `wage` (รายวัน) + `ot_rate` (คำนวณอัตโนมัติ = wage/8×1.5)
- Attendance ใช้ `morning_check`/`afternoon_check` boolean + `ot` double precision (ชั่วโมง decimal) + `leave_reason` text nullable (เหตุผลหยุดงาน — null หมายถึงไม่ได้หยุดหรือไม่ได้ระบุ)
- ไม่มี `hours_worked` GENERATED column — คำนวณใน application layer เมื่อต้องการ
- Period ใช้ `is_active boolean` ไม่ใช้ `status enum` — เปิด/ปิดงวดด้วย flag เดียว
- "Active period" หมายถึง `is_active = true AND today BETWEEN start_date AND end_date`
- tasks table ใช้ `employee_ids text` (comma-separated) — ใช้แทน work_logs ในการบันทึกงาน
- Role management (`line_users` table) ยังไม่ implement ใน v1 (เพิ่มใน Phase 3)
- ไม่ทำ multi-tenant ใน v1
- PDF report export ใช้ PDFKit + Sarabun font — implement แล้วใน Phase 1 (ก่อน schedule เดิม)

## Current Phase

**Phase 2 — Payroll Core** (starting)

## What's done ✅

### Infrastructure
- [x] Monorepo scaffold (npm workspaces)
- [x] Backend: Express app + helmet + cors + morgan
- [x] Backend: `/health` route + `/webhook/line` route
- [x] Backend: LINE signature verification (`signature.ts`)
- [x] Backend: Supabase client singleton (`lib/supabase.ts`)
- [x] Frontend: React + Vite + Tailwind scaffold + AppLayout

### Database
- [x] Migration `0002_rebuild_schema.sql` — employees, periods (is_active), attendance (unique constraint), tasks
- [x] Migration `0006_attendance_leave_reason.sql` — เพิ่ม `leave_reason text` ใน attendance

### Employee Feature
- [x] Employee repository (select, insert, update, softDelete)
- [x] Employee service (CRUD + calcOtRate)
- [x] Employee controller + routes (`/api/employees`)
- [x] LINE handler: `>พนักงาน` → Flex menu, `>รายชื่อ` → text list
- [x] LIFF: AddEmployeePage (`/employees/new`)
- [x] LIFF: AddEmployeeSuccessPage (`/employees/new/success`)
- [x] LIFF: EditEmployeeSelectPage (`/employees/edit`)
- [x] LIFF: EditEmployeePage (`/employees/:id/edit`) + delete

### Attendance / Period Feature
- [x] Period repository (selectActive, insert, selectById, selectAll)
- [x] Period service + controller + routes (`GET /api/periods`, `GET /api/periods/active`, `POST /api/periods`)
- [x] Attendance repository (missingDates, byPeriodAndDate, upsertBatch)
- [x] Attendance service + controller + routes (`/api/attendance/missing-dates`, `GET /api/attendance`, `POST /api/attendance/batch`)
- [x] LINE handler: `>ลงเวลา` → Flex message พร้อม LIFF URL
- [x] LIFF: AttendanceOverviewPage (`/attendance`) — แสดงทุกงวด + วันที่ยังไม่ได้ลง → navigate to log form
- [x] LIFF: AttendancePage (`/attendance/log`) — ฟอร์มลงเวลารายวัน (เช้า/บ่าย/OT) + เหตุผลหยุดงาน (expanded row เมื่อเช็ค "หยุด")
- [x] LIFF: CreatePeriodPage (`/periods/new`) — form สร้างงวด

### Tasks Feature
- [x] Task model: `task_id`, `task_date`, `task`, `detail`, `start_time`, `end_time`, `employee_ids`
- [x] Task images model: `task_images` table (`image_id`, `task_id`, `file_name`, `public_url`, `storage_path`, `module`)
- [x] Task repository: `insertTasks`, `insertTaskImages`, `getTasksByDate`, `getTasksByDateRange`, `deleteTasksByDate`
- [x] Task routes: `GET /api/tasks?date=`, `POST /api/tasks`, `PUT /api/tasks`, `POST /api/tasks/summary`, `POST /api/tasks/images`
- [x] LIFF: CreateTasksPage (`/tasks/new`) — batch task entry + image upload per task + success state
- [x] LINE: Daily Summary Broadcast (`sendDailySummary`) หลัง save tasks

### Reports Feature
- [x] `GET /api/reports/work?date=YYYY-MM-DD` — PDF 3 หน้า A4 landscape: attendance summary (แสดง "ห" amber เมื่อหยุดมีเหตุผล + footnote รายการเหตุผล), OT summary, task list
- [x] `GET /api/reports/work/current` — work report ของ active period ณ วันนี้ (TZ-aware)
- [x] `GET /api/reports/daily?date=YYYY-MM-DD` — daily summary PDF (แสดงเหตุผลหยุดใต้ชื่อพนักงาน)
- [x] LIFF: WorkReportPage (`/report/work`) — date picker + ปุ่ม download PDF
- [x] PDFKit + Sarabun font (Regular + Bold) สำหรับ Thai text

## What's next

### Phase 2 — Payroll Core
- [ ] `PATCH /api/periods/:id` — ปิดงวด (is_active = false)
- [ ] Payroll calculation engine (gross = วันทำงาน × wage + OT × ot_rate)
- [ ] `POST /api/periods/:id/calculate` + `GET /api/periods/:id/results`
- [ ] LINE handler `>คำนวณ` → เลือกงวด → reply Flex สรุปยอด

### Phase 3 — Polish
- [ ] LINE auth (line_users table + role guard)
- [ ] Wire LINE signature verification เป็น middleware จริง
- [ ] Error handling UX polish (reply ภาษาไทย + help message)
