# JASS Payroll LINE OA — Implementation Checklist

ทุก task มี acceptance criteria ชัดเจน — AI coding session เอาไปลงมือได้เลย

---

## Phase 0 — Foundation ✅ Complete

### [x] DB Schema Migration
- Migration `0002_rebuild_schema.sql` — employees, periods (is_active), attendance (unique constraint), tasks
- Note: schema ต่างจาก TECH_SPEC v1.0 — ใช้ int PK, first_name/last_name, wage รายวันเท่านั้น, ไม่มี hours_worked GENERATED

### [x] Supabase Client Setup
- `apps/backend/src/lib/supabase.ts` — singleton ใช้ SUPABASE_SERVICE_ROLE_KEY

### [x] LINE Signature Verification
- `apps/backend/src/services/line/signature.ts` — logic มีแล้ว
- ⚠️ ยังไม่ wire เป็น middleware ใน `line-webhook.route.ts`

### [x] LIFF Scaffold
- Frontend React + Vite + Tailwind + AppLayout + routing

---

## Phase 1 — Employee + Attendance MVP ✅ Complete

### Employee Feature ✅ Complete

#### [x] Employee Repository
- `apps/backend/src/modules/employees/employee.repository.ts`
- Functions: `selectAll`, `selectById`, `insert`, `updateById`, `softDeleteById`

#### [x] Employee Service
- `apps/backend/src/modules/employees/employee.service.ts`
- `createEmployee` คำนวณ `ot_rate = wage/8×1.5` อัตโนมัติ

#### [x] Employee Controller + Routes
- `GET /api/employees` — รายชื่อ active
- `POST /api/employees` — สร้าง
- `GET /api/employees/:id` — ดูรายคน
- `PATCH /api/employees/:id` — แก้ไข
- `DELETE /api/employees/:id` — soft delete

#### [x] Employee LINE Handler
- trigger `>พนักงาน` → Flex menu (รายชื่อ / สร้าง / แก้ไข/ลบ)
- trigger `>รายชื่อ` → text list

#### [x] LIFF: AddEmployeePage
- Route: `/employees/new`
- Form: ชื่อ, นามสกุล, ค่าแรง + OT rate card (read-only)
- Success → `/employees/new/success`

#### [x] LIFF: EditEmployeeSelectPage
- Route: `/employees/edit`
- card list พนักงาน active → navigate `/employees/:id/edit`

#### [x] LIFF: EditEmployeePage
- Route: `/employees/:id/edit`
- pre-filled form + modal confirm แก้ไข + modal confirm ลบ

---

### Period Feature ✅ Complete

#### [x] Period Repository
- `apps/backend/src/modules/periods/period.repository.ts`
- `selectActivePeriod(today)` — หางวดที่ `is_active=true AND today BETWEEN start..end`
- `insertPeriod(data)` — สร้างงวดใหม่
- `selectPeriodById(id)`

#### [x] Period Service + Controller + Routes
- `GET /api/periods` → Period[] (ทั้งหมด เรียงล่าสุดก่อน)
- `GET /api/periods/active` → `{ period: Period | null }`
- `POST /api/periods` → Period (validate start_date ≤ end_date)

#### [x] Attendance LINE Handler
- trigger `>ลงเวลา` → Flex message + ปุ่มเปิด LIFF `/attendance`

#### [x] LIFF: AttendanceOverviewPage
- Route: `/attendance` (หน้าหลักลงเวลา)
- Load `GET /api/periods` → แสดง period selector ถ้ามีหลายงวด
- ถ้าไม่มีงวดเลย → empty state + ปุ่ม "สร้างงวดใหม่"
- แสดงรายการวันทั้งหมดในงวดพร้อมสถานะ:
  - ✅ ลงเวลาแล้ว (date ไม่อยู่ใน missing-dates)
  - ⏰ ยังไม่ลงเวลา (date อยู่ใน missing-dates และ ≤ today)
  - ○ ยังไม่ถึงวัน (date > today, disabled)
- กดวันที่ → navigate `/attendance/log` พร้อม state `{ period, date }`

#### [x] LIFF: AttendancePage (Log Form)
- Route: `/attendance/log`
- รับ state `{ period?, date? }` จาก overview
  - ถ้ามี state.period → ใช้ period นั้น (ไม่ต้อง fetch active)
  - ถ้ามี state.date → pre-select วันนั้นทันที (รองรับทั้ง logged และ missing)
  - ถ้าไม่มี state → fetch active period, auto-select วันนี้
- ตาราง: ชื่อ | checkbox เช้า | checkbox บ่าย | input OT (ชม. + น.)
- Submit: `POST /api/attendance/batch` → navigate `/tasks/new`

#### [x] LIFF: CreatePeriodPage
- Route: `/periods/new`
- Mount check: ถ้ามี active period → redirect `/attendance`
- Form: start_date, end_date
- Submit → `POST /api/periods` → redirect `/attendance`

---

### Attendance Feature ✅ Complete

#### [x] Attendance Repository
- `apps/backend/src/modules/attendance/attendance.repository.ts`
- `selectLoggedDatesByPeriod(periodId)` — distinct dates ที่มีบันทึกแล้ว
- `selectAttendanceByPeriodAndDate(periodId, date)`
- `upsertAttendanceBatch(records[])` — ON CONFLICT (date, employee, period)

#### [x] Attendance Service
- `getMissingDates(periodId)` — allDates − loggedDates
- `getAttendanceForDate(periodId, date)`
- `saveAttendanceBatch(dto)`

#### [x] Attendance Controller + Routes
- `GET /api/attendance/missing-dates?period_id=X`
- `GET /api/attendance?period_id=X&date=Y`
- `POST /api/attendance/batch`

---

### Tasks Feature ✅ Complete

#### [x] Task Model
- `tasks` table: `task_id`, `task_date`, `task`, `detail`, `start_time`, `end_time`, `employee_ids`
- `task_images` table: `image_id`, `task_id`, `file_name`, `public_url`, `storage_path`, `module`

#### [x] Tasks Repository
- `insertTasks(records[])` — batch insert
- `insertTaskImages(records[])` — insert images linked to task_id
- `getTasksByDate(date)` — query พร้อม join `task_images`
- `getTasksByDateRange(start, end)` — ใช้ใน report
- `deleteTasksByDate(date)` — ใช้กับ PUT (replace)

#### [x] Tasks Routes
- `GET /api/tasks?date=YYYY-MM-DD` — ดูงานตามวัน (พร้อม images)
- `POST /api/tasks` — batch create tasks + images + trigger LINE summary
- `PUT /api/tasks` — delete ทั้งหมดของวันนั้นแล้ว insert ใหม่ (idempotent replace)
- `POST /api/tasks/summary` — trigger LINE summary manually
- `POST /api/tasks/images` — upload รูป (multipart, max 5) → Supabase Storage → return `{ public_url, storage_path, file_name }`

#### [x] LIFF: CreateTasksPage
- Route: `/tasks/new`
- รับ state `{ date, employees, period, remainingCount }` จาก AttendancePage
- แสดงรายการงาน (เพิ่มได้เรื่อยๆ): ชื่องาน*, ดีเทล, start_time, end_time, พนักงาน (multi-select dropdown), รูปภาพ
- Image upload: compress ก่อน (`compressImage.ts`) → `POST /api/tasks/images` → เก็บ URL
- Submit → `POST /api/tasks` → success view
  - ยังเหลือวัน → "บันทึกสำเร็จ | เหลืออีก X วัน" + ปุ่ม "ลงเวลาวันถัดไป" → `/attendance`
  - ครบทุกวัน → "ลงเวลาครบทุกวันแล้ว!" + ปุ่ม "กลับหน้าหลัก" → `/`

#### [x] LINE: Daily Summary Broadcast
- `sendDailySummary(date, tasks)` — fire-and-forget หลัง save tasks
- ข้อความ: สรุปการทำงานวันที่, มาทำงาน/ขาด, รายการงาน + ผู้รับผิดชอบ

---

### Reports Feature ✅ Complete (implement เร็วกว่า Phase 3)

#### [x] Report Service: generateWorkReport(date)
- เรียก `selectActivePeriod(date)` → ถ้าไม่มีงวด throw error
- ดึง attendance, employees, tasks แบบ parallel
- สร้าง PDF 3 หน้า A4 landscape ด้วย PDFKit + Sarabun font:
  - หน้า 1: ตารางการเข้างานรายคน (วัน × พนักงาน) + รวมแรงงาน + OT
  - หน้า 2: ตาราง OT รายวันรายคน + OT รวม
  - หน้า 3: รายการงาน (วันที่ | งาน + detail | ผู้รับผิดชอบ)

#### [x] Report Routes
- `GET /api/reports/work?date=YYYY-MM-DD` — work report PDF ของงวดที่ date อยู่
- `GET /api/reports/work/current` — work report งวดปัจจุบัน (TZ-aware ใช้ `env.TZ`)
- `GET /api/reports/daily?date=YYYY-MM-DD` — daily summary PDF

#### [x] LIFF: WorkReportPage
- Route: `/report/work`
- Date picker (default = วันนี้) → ลิงก์ download `GET /api/reports/work?date=`

---

## Phase 2 — Payroll Core 🔲 Not started

### [ ] Period Management (เพิ่มเติม)
- `PATCH /api/periods/:id` — close งวด (set is_active = false)
- LINE handler: `>งวด` → Flex menu

### [ ] Payroll Calculation Engine
- Pure function: `calculatePayroll(employees[], attendance[], period) → PayrollResult[]`
- gross = วันทำงาน × wage + sum(ot) × ot_rate
- "วันทำงาน" = แถวที่ `morning_check OR afternoon_check = true`

### [ ] Calculate Endpoint + LINE Handler
- `POST /api/periods/:id/calculate` — คำนวณและ cache ผล
- `GET /api/periods/:id/results` — ดูผลคำนวณ
- LINE handler: `>คำนวณ` → เลือกงวด → reply Flex สรุปยอด

---

## Phase 3 — Polish & Report 🔲 Planned

### [ ] LINE Signature Middleware
- Wire `signature.ts` เป็น Express middleware ใน `line-webhook.route.ts`

### [ ] LINE Auth (line_users table)
- Migration: สร้าง `line_users` table (line_user_id, role)
- Middleware: extract userId จาก LIFF token → query role
- Guard: endpoint ที่ต้องการ clerk role

### [ ] Report: สรุปเวลางาน + เงินเดือน
- `GET /api/periods/:id/report` — สรุปรายคน
- LINE handler: `>รายงาน` → Flex แสดงยอดรายคน

### [ ] Error UX Polish
- Reply ภาษาไทยที่เข้าใจง่ายเมื่อ error
- ถ้าพิมพ์คำสั่งไม่รู้จัก → reply help message

---

## Phase 4 — Deploy & UAT 🔲 Planned

### [ ] Deploy Backend (Railway)
### [ ] Deploy Frontend (Vercel)
### [ ] LINE OA Production Config
### [ ] UAT Checklist
- [ ] เพิ่มพนักงาน → ขึ้น list
- [ ] ลงเวลา → ข้อมูลถูกต้องใน Supabase
- [ ] สร้างงวด → calculate → ยอดตรงกับ Excel
- [ ] ปิดงวด → ไม่สามารถแก้ attendance ในช่วงนั้น (ถ้า implement lock guard)
