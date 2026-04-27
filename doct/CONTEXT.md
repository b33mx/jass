# JASS Payroll LINE OA — Project Context

> Last updated: 2026-04-27 | Phase: Phase 0 — Foundation

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
- API response format: `{ success: true, data: ... }` หรือ `{ success: false, error: string, code?: string }`
- DB access ผ่าน repository layer เท่านั้น — ไม่ query Supabase ตรงจาก route/controller
- Service layer = pure business logic ไม่รู้จัก HTTP/LINE
- Handler layer = รู้จัก LINE event, เรียก service, build Flex message
- Timezone: บันทึก UTC ใน DB, แสดงผล Asia/Bangkok (UTC+7)
- Zod สำหรับ validate ทุก input (API body + LINE event payload)

## Decisions Made (ไม่ต้องถามซ้ำ)

- ใช้ Supabase client โดยตรง — ไม่ใช้ Prisma/Drizzle
- LIFF สำหรับ form input ที่ซับซ้อน — ไม่ทำ chat-based multi-step form
- Role management อยู่ใน `line_users` table — ไม่ hardcode LINE userId ใน code
- `hours_worked` เป็น GENERATED ALWAYS column ใน SQL — ไม่คำนวณใน app
- ไม่ทำ multi-tenant ใน v1
- ไม่ทำ PDF export ใน v1
- Attendance UI = 2-step webview: Step 1 ตารางพนักงาน (เช้า/บ่าย checkbox + OT input), Step 2 รายการงาน (description + multi-select ผู้รับผิดชอบ)
- attendance table ใช้ `shift_morning` / `shift_afternoon` boolean ไม่ใช่ check_in/check_out time
- work_logs ใช้ `responsible_employee_ids uuid[]` — 1 task มีผู้รับผิดชอบหลายคน

## Current Phase

**Phase 0 — Foundation** (กำลังเริ่ม)

สิ่งที่ต้องทำใน Phase 0:
- [ ] เขียน DB migration (`0001_init_schema.sql`) ตาม schema ใน TECH_SPEC.md
- [ ] เขียน seed data (`seed.sql`) สำหรับ local dev
- [ ] Setup Supabase client ใน backend (singleton, ใช้ service_role)
- [ ] Implement LINE signature verification middleware
- [ ] Setup LIFF SDK ใน frontend + routing

## What's done

- [x] Monorepo scaffold (npm workspaces)
- [x] Backend: Express app + helmet + cors + morgan
- [x] Backend: `/health` route + `/webhook/line` route
- [x] Backend: LINE signature verification (file มีแล้ว: `signature.ts`)
- [x] Backend: Employee Flex Menu message builder
- [x] Backend: Basic message handler (trigger: `>พนักงาน`)
- [x] Frontend: React + Vite + Tailwind scaffold
- [x] Frontend: AppLayout + HomePage placeholder
- [x] CI: GitHub Actions lint + build
- [x] `.env.example` สำหรับทั้ง 2 app

## What's next (Phase 0)

- [ ] DB Schema migration file
- [ ] Supabase client setup ใน backend
- [ ] LINE auth middleware (role check จาก line_users)
- [ ] LIFF init setup ใน frontend
- [ ] Employee repository + service + routes (เตรียมสำหรับ Phase 1)
