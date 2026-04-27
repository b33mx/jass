# JASS Payroll LINE OA — Implementation Checklist

ทุก task มี acceptance criteria ชัดเจน — AI coding session เอาไปลงมือได้เลย

---

## Phase 0 — Foundation

### [ ] DB Schema Migration

**File:** `supabase/migrations/0001_init_schema.sql`

- เขียน CREATE TABLE สำหรับ: `employees`, `attendance`, `work_logs`, `payroll_periods`, `payroll_results`, `line_users`
- `attendance.hours_worked` ต้องเป็น `GENERATED ALWAYS AS (...) STORED`
- ทุก table มี `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Constraint: `attendance(employee_id, work_date)` → UNIQUE
- Constraint: `payroll_results(period_id, employee_id)` → UNIQUE
- Constraint: `payroll_periods.status` CHECK `IN ('open', 'locked')`
- Constraint: `employees.wage_type` CHECK `IN ('daily', 'monthly')`
- Constraint: `line_users.role` CHECK `IN ('clerk', 'admin')`
- Acceptance: run migration ใน Supabase → ไม่มี error, table ขึ้นใน dashboard

### [ ] Supabase Client Setup (Backend)

**File:** `apps/backend/src/lib/supabase.ts`

- Export singleton `supabaseAdmin` ใช้ `SUPABASE_SERVICE_ROLE_KEY`
- Import จาก `@supabase/supabase-js`
- ติดตั้ง package: `npm install @supabase/supabase-js --workspace apps/backend`
- ไม่ใช้ anon key ฝั่ง backend
- Acceptance: import ใน route แล้ว `supabaseAdmin.from('employees').select('*')` ได้ข้อมูล

### [ ] LINE Signature Verification Middleware (Wire ให้เสร็จ)

**File:** `apps/backend/src/middleware/verifyLineSignature.ts`

- ใช้ logic ที่มีใน `signature.ts` มา wrap เป็น Express middleware
- ถ้า signature ไม่ valid → return HTTP 200 (ตาม LINE spec) พร้อม log warning
- ถ้า valid → `next()`
- Wire เข้าใน `line-webhook.route.ts` ก่อน handler
- Acceptance: ส่ง request ที่ signature ผิด → log "invalid signature" แต่ return 200

### [ ] LIFF Init Setup (Frontend)

**File:** `apps/web/src/lib/liff.ts`

- ติดตั้ง: `@line/liff` มีใน dependencies แล้ว
- Export `initLiff()` function: `liff.init({ liffId: import.meta.env.VITE_LIFF_ID })`
- Export `getLiffUserId()`: return `liff.getProfile().userId` หลัง init
- Call `initLiff()` ใน `main.tsx` หรือ top-level component
- Acceptance: เปิดผ่าน LINE → `liff.isLoggedIn()` = true, ได้ userId

### [ ] Seed Data

**File:** `supabase/seed/seed.sql`

- INSERT 1 `line_users` role='clerk' (ใส่ LINE userId จริงของ dev เพื่อ test)
- INSERT 1 `line_users` role='admin'
- INSERT 2–3 `employees` ตัวอย่าง (wage_type: daily + monthly)
- Acceptance: run seed → Supabase มีข้อมูล seed ให้ test ได้ทันที

---

## Phase 1 — Employee + Attendance MVP

### [ ] Employee Repository

**File:** `apps/backend/src/repositories/employee.repository.ts`

- `getAll()` → employees ที่ `is_active = true`
- `getById(id)` → employee 1 record หรือ null
- `create(data)` → INSERT + return created record
- `update(id, data)` → UPDATE + return updated record
- `deactivate(id)` → SET `is_active = false, updated_at = now()`
- Acceptance: unit-testable (รับ supabase client เป็น parameter หรือ mock ได้)

### [ ] Employee Service

**File:** `apps/backend/src/services/employee.service.ts`

- `listEmployees()` → call repository.getAll()
- `createEmployee(data)` → validate ด้วย Zod schema + call repository.create()
  - Required: name (string, min 1), wage_type, rate ≥ 0
- `updateEmployee(id, data)` → validate + call repository.update()
- `deactivateEmployee(id)` → check exists ก่อน → call repository.deactivate()
- Acceptance: throw readable Error ถ้า validation fail

### [ ] Employee API Routes

**File:** `apps/backend/src/routes/employee.route.ts`

- `GET /api/employees` → listEmployees()
- `POST /api/employees` → createEmployee(req.body)
- `PATCH /api/employees/:id` → updateEmployee(id, req.body)
- `DELETE /api/employees/:id` → deactivateEmployee(id)
- Wire ใน `routes/index.ts`
- Response format: `{ success: true, data: ... }` หรือ `{ success: false, error: string }`
- Acceptance: test ด้วย curl/Postman → CRUD ทำงานได้

### [ ] Employee LINE Handler Update

**File:** `apps/backend/src/services/line/handlers/message.handler.ts`

- เพิ่ม trigger: `>พนักงาน` → reply Flex menu (มีอยู่แล้ว)
- Handle postback `employee_list` → call listEmployees() → reply text list
- Handle postback `employee_create` → reply message พร้อม LIFF URL: `/employees/create`
- Handle postback `employee_edit:{id}` → reply LIFF URL: `/employees/{id}/edit`
- Handle postback `employee_delete:{id}` → confirm → deactivate → reply success
- Acceptance: กดปุ่มทุกปุ่มใน Flex menu → ได้ response ถูกต้อง

### [ ] Employee LIFF Pages

**Files:** `apps/web/src/pages/employees/`

- `/employees/create` → Form: name, position, wage_type (select), rate fields
  - Submit → `POST /api/employees`
  - Success → แสดง "สร้างสำเร็จ" + ปุ่มปิด LIFF
- `/employees/:id/edit` → เหมือน create แต่ดึงข้อมูลเดิมมา pre-fill
  - Submit → `PATCH /api/employees/:id`
- Validation: client-side ด้วย HTML5 required + number min=0
- Acceptance: กรอก form → submit → ข้อมูลขึ้นใน Supabase

### [ ] Attendance Repository

**File:** `apps/backend/src/repositories/attendance.repository.ts`

- `upsert(data: { employeeId, workDate, shiftMorning, shiftAfternoon, otHours })` → INSERT ... ON CONFLICT (employee_id, work_date) DO UPDATE
- `upsertMany(entries[])` → loop upsert (Supabase JS ไม่มี native batch upsert สำหรับ conflict)
- `getByEmployee(employeeId, startDate, endDate)` → attendance ในช่วง
- `getByPeriod(startDate, endDate)` → attendance ทุกคนในช่วง (ใช้สำหรับ payroll)
- Acceptance: upsert record เดิม → update แทน insert ใหม่, hours_worked คำนวณอัตโนมัติจาก DB

### [ ] Attendance Service

**File:** `apps/backend/src/services/attendance.service.ts`

- `batchLogAttendance({ workDate, entries[] })` → validate per entry:
  - shiftMorning หรือ shiftAfternoon ต้องเป็น true อย่างน้อย 1 อย่าง
  - ot_hours ≥ 0
  - workDate ต้องไม่อยู่ในงวดที่ status = 'locked'
  - call repository.upsert() ต่อ entry (หรือ bulk upsert)
- `batchLogWorkLogs({ workDate, tasks[] })` → validate per task:
  - description ไม่ว่าง
  - responsibleEmployeeIds มีอย่างน้อย 1 id
  - call repository.insertMany()
- Acceptance: บันทึก attendance ซ้ำ same employee + same date → update (ไม่ duplicate)

### [ ] Attendance API Route

**File:** `apps/backend/src/routes/attendance.route.ts`

- `POST /api/attendance` → logAttendance(req.body)
- `GET /api/attendance?employeeId=&startDate=&endDate=` → getByEmployee()
- Wire ใน `routes/index.ts`
- Acceptance: POST บันทึกเวลา → GET เห็นข้อมูล

### [ ] Attendance API — Batch Routes

**File:** `apps/backend/src/routes/attendance.route.ts`

เพิ่ม batch endpoints:

- `POST /api/attendance/batch` → รับ `{ workDate, entries: [{ employeeId, shiftMorning, shiftAfternoon, otHours }] }`
  - UPSERT ทีละแถวใน loop (conflict: employee_id + work_date)
  - Validate: ot_hours ≥ 0, workDate ต้องไม่อยู่ในงวดที่ locked
- `POST /api/work-logs/batch` → รับ `{ workDate, tasks: [{ description, responsibleEmployeeIds }] }`
  - INSERT work_logs หลายแถวพร้อมกัน
  - Validate: description ไม่ว่าง, responsibleEmployeeIds ไม่ว่าง array
- Acceptance: POST 1 request → หลายแถวใน DB

---

### [ ] Attendance LIFF Page — Step 1: ตารางลงเวลา

**File:** `apps/web/src/pages/attendance/log.tsx`

**Layout:**
```
วันที่: [date picker — default วันนี้]

┌─────────────┬──────┬──────┬─────────┐
│ ชื่อพนักงาน  │ เช้า │ บ่าย │ OT (ชม) │
├─────────────┼──────┼──────┼─────────┤
│ สมชาย       │  ☐  │  ☐  │ [  0  ] │
│ สมหญิง      │  ☐  │  ☐  │ [  0  ] │
└─────────────┴──────┴──────┴─────────┘

[ถัดไป →] ← disabled ถ้าไม่มีใคร tick
```

**Logic:**
- `GET /api/employees` → render แถวตาม employees active
- State: `{ [employeeId]: { shiftMorning, shiftAfternoon, otHours } }`
- ปุ่ม "ถัดไป" disabled เมื่อไม่มี employee ที่ tick เช้า หรือ บ่าย เลยสักคน
- กด "ถัดไป" → เก็บ attendance state แล้วเปลี่ยนไป Step 2 (ไม่ submit ยัง)
- Acceptance: tick/untick + ใส่ OT → state update ถูกต้อง, ปุ่ม disabled logic ทำงาน

---

### [ ] Attendance LIFF Page — Step 2: รายการงาน

**File:** `apps/web/src/pages/attendance/log.tsx` (ต่อจาก Step 1 — ใช้ state เดียวกัน)

**Layout:**
```
รายการงานวันที่ [วันที่]

┌──────────────────────────────────────┐
│ รายการที่ 1                           │
│ รายละเอียด: [textarea]               │
│ ผู้รับผิดชอบ: [multi-select dropdown] │
│                          [ลบ ✕]      │
└──────────────────────────────────────┘

[+ เพิ่มรายการงาน]

[← ย้อนกลับ]  [บันทึกทั้งหมด ✓]
```

**Multi-select Dropdown:**
- แสดงรายชื่อพนักงาน active ทั้งหมด (ใช้ list เดิมที่ fetch มาแล้วใน Step 1)
- เลือกได้หลายคน แสดง badge ชื่อที่เลือกไว้
- ไม่ต้อง library ภายนอก — ทำเป็น custom dropdown ด้วย Tailwind + useState

**Submit Logic:**
- กด "บันทึกทั้งหมด":
  1. `POST /api/attendance/batch` ส่ง attendance entries ที่ tick
  2. `POST /api/work-logs/batch` ส่ง tasks ทั้งหมด
  3. รอทั้งคู่ด้วย `Promise.all`
  4. สำเร็จ → แสดง success state + ปุ่ม "ปิด" (liff.closeWindow())
- Loading state ระหว่าง submit (ปิดปุ่มไม่ให้กดซ้ำ)

**Validation ก่อน submit:**
- มีรายการงานอย่างน้อย 1 รายการ (warn ถ้าไม่มี แต่ไม่ block — เสมียนอาจลงเวลาอย่างเดียว)
- ทุก task ต้องมี description และ responsible อย่างน้อย 1 คน

- Acceptance: กรอก 3 tasks → submit → work_logs table มี 3 แถว, attendance มีแถวตาม tick

---

## Phase 2 — Payroll Core

### [ ] Payroll Period Repository + Service + Routes

**Files:** `apps/backend/src/repositories/payroll.repository.ts`, `services/payroll.service.ts`, `routes/payroll.route.ts`

- `POST /api/payroll-periods` → สร้างงวด { start_date, end_date }
  - Validate: start_date < end_date
- `GET /api/payroll-periods` → รายการงวดทั้งหมด
- `PATCH /api/payroll-periods/:id/lock` → SET status = 'locked', locked_at = now()
  - ต้อง calculate ก่อน lock (มี payroll_results อยู่แล้ว)
- Acceptance: สร้าง, ดู, lock งวดได้

### [ ] Payroll Calculation Engine

**File:** `apps/backend/src/services/payroll/calculator.ts`

```typescript
// Signature ที่ต้องการ
function calculatePayroll(
  employees: Employee[],
  attendance: Attendance[],
  period: PayrollPeriod
): PayrollResult[]
```

- Loop ทุก employee
- filter attendance ของ employee ในช่วง start_date → end_date
- นับ working_days, total_hours, ot_hours
- คำนวณ gross:
  - `daily`: working_days × rate_daily + ot_hours × rate_ot_per_hour
  - `monthly`: rate_monthly + ot_hours × rate_ot_per_hour
- บันทึก calculation_detail เป็น JSON (breakdown รายวัน)
- Pure function — ไม่ access DB โดยตรง (testable)
- Acceptance: ทดสอบด้วย mock data → ยอดตรงกับ manual calculation

### [ ] Calculate Endpoint + LINE Handler

**Route:** `POST /api/payroll-periods/:id/calculate`

- GET period + GET attendance ในช่วง + GET active employees
- เรียก calculatePayroll()
- UPSERT payroll_results (conflict: period_id + employee_id)
- Return summary
- LINE handler: `>คำนวณ` → เลือกงวด → call endpoint → reply Flex สรุปยอด
- Acceptance: LINE reply แสดงยอดรายคน + รวม

---

## Phase 3 — Polish & Report

### [ ] Work Log Service + Route

- `POST /api/work-logs` → บันทึกรายละเอียดงาน (employee_id, work_date, description)
- `GET /api/work-logs?employeeId=&startDate=&endDate=` → ดูรายการ
- Acceptance: บันทึกหลาย log ต่อวันได้ (ไม่ต้อง unique)

### [ ] Report: ดูสรุปเวลางานรายงวด

- LINE handler: `>รายงาน` → เมนูประเภทรายงาน
- ประเภท 1: สรุปเวลา → แสดง check_in/out + OT รายคน
- ประเภท 2: สรุปเงินเดือน → แสดงยอดสุทธิรายคน
- Admin ดูได้ทุกรายงาน (read-only ไม่มีปุ่ม action)
- Acceptance: Admin LINE ดูรายงานได้ แต่ไม่เห็นปุ่ม CRUD

### [ ] Error Handling + UX Polish

- Reply message เป็นภาษาไทยที่เข้าใจง่ายเมื่อเกิด error
- ถ้าพิมพ์คำสั่งที่ไม่รู้จัก → reply help message แสดงคำสั่งทั้งหมด
- LIFF: loading state ขณะ submit form
- Acceptance: error ทุกกรณีมี user-friendly message

---

## Phase 4 — Deploy & UAT

### [ ] Deploy Backend (Railway)

- สร้าง Railway project + set environment variables
- `railway up` หรือ connect GitHub repo
- Test `/health` endpoint บน production URL
- Acceptance: `GET https://api.jass.xxx/health` → `{ status: "ok" }`

### [ ] Deploy Frontend (Vercel)

- สร้าง Vercel project + set `VITE_LIFF_ID`, `VITE_API_BASE_URL`
- Build + deploy
- Acceptance: LIFF URL เปิดใน LINE ได้

### [ ] LINE OA Production Config

- ตั้ง Webhook URL production ใน LINE Developers Console
- ตั้ง LIFF Endpoint URL ชี้ไปที่ Vercel URL
- Acceptance: ส่งข้อความใน LINE OA production → ได้ reply

### [ ] UAT Checklist

- [ ] เสมียน: เพิ่มพนักงาน → ขึ้น list
- [ ] เสมียน: บันทึกเวลาทำงาน → ข้อมูลถูกต้อง
- [ ] เสมียน: สร้างงวด → calculate → ยอดตรงกับ Excel ที่เคยทำ
- [ ] เสมียน: lock งวด → ไม่สามารถแก้ attendance ในช่วงนั้น
- [ ] Admin: ดูรายงานเวลา → ไม่เห็นปุ่ม CRUD
- [ ] Admin: ดูยอดเงินเดือน → ยอดถูกต้อง
