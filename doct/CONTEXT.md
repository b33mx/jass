# JASS Payroll LINE OA — Project Context

> Last updated: 2026-04-28 | Phase: Phase 1 — Employee + Attendance MVP (in progress)

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
- Zod สำหรับ validate ทุก input (API body)

## Decisions Made (ไม่ต้องถามซ้ำ)

- ใช้ Supabase client โดยตรง — ไม่ใช้ Prisma/Drizzle
- LIFF สำหรับ form input ที่ซับซ้อน — ไม่ทำ chat-based multi-step form
- PK ใช้ `int generated always as identity` — ไม่ใช้ UUID (ลด complexity)
- Employee schema ใช้ `first_name`/`last_name` + `wage` (รายวัน) + `ot_rate` (คำนวณอัตโนมัติ = wage/8×1.5)
- Attendance ใช้ `morning_check`/`afternoon_check` boolean + `ot` double precision (ชั่วโมง decimal)
- ไม่มี `hours_worked` GENERATED column — คำนวณใน application layer เมื่อต้องการ
- Period ใช้ `is_active boolean` ไม่ใช้ `status enum` — เปิด/ปิดงวดด้วย flag เดียว
- "Active period" หมายถึง `is_active = true AND today BETWEEN start_date AND end_date`
- tasks table ใช้ `employee_ids text` (comma-separated) — ใช้แทน work_logs ในการบันทึกงาน
- Role management (`line_users` table) ยังไม่ implement ใน v1 (เพิ่มใน Phase 3)
- ไม่ทำ multi-tenant ใน v1
- ไม่ทำ PDF export ใน v1

## Current Phase

**Phase 1 — Employee + Attendance MVP** (in progress)

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
- [x] Period repository (selectActive, insert, selectById)
- [x] Period service + controller + routes (`/api/periods/active`, `POST /api/periods`)
- [x] Attendance repository (missingDates, byPeriodAndDate, upsertBatch)
- [x] Attendance service + controller + routes (`/api/attendance/missing-dates`, `GET /api/attendance`, `POST /api/attendance/batch`)
- [x] LINE handler: `>ลงเวลา` → Flex message พร้อม LIFF URL
- [x] LIFF: AttendancePage (`/attendance`) — period check, dropdown วันที่ขาด, table + submit
- [x] LIFF: CreatePeriodPage (`/periods/new`) — form สร้างงวด

## What's next

### Phase 1 — เหลือ
- [ ] Tasks feature: บันทึกรายการงานรายวัน (ยังไม่มี API หรือ LIFF)

### Phase 2 — Payroll Core
- [ ] Payroll calculation engine (gross = วันทำงาน × wage + OT × ot_rate)
- [ ] Calculate endpoint + LINE handler `>คำนวณ`
- [ ] Period lock (is_active = false เมื่อสรุปเสร็จ)

### Phase 3 — Polish & Report
- [ ] Report: สรุปเวลา/เงินเดือนรายงวด
- [ ] LINE handler `>รายงาน`
- [ ] LINE auth (line_users table + role guard)
- [ ] Error handling UX polish
