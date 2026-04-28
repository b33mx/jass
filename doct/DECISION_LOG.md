# JASS Payroll LINE OA — Decision Log

บันทึก decisions ที่ผ่านการคิดแล้ว — AI ไม่ต้อง propose ทางเลือกที่ถูก reject ไปแล้ว

---

| Date | Decision | Options ที่พิจารณา | เลือก | เหตุผล |
|------|----------|--------------------|-------|--------|
| 2026-04-27 | Database | Firebase Firestore vs Supabase (PostgreSQL) | **Supabase** | SQL เหมาะกับ payroll calculation มากกว่า (JOIN, aggregate, constraint), Supabase มี dashboard + migration built-in |
| 2026-04-27 | Frontend Framework | Next.js vs React + Vite | **React + Vite** | LIFF ไม่ต้องการ SSR, Vite เร็วกว่า, deploy ง่ายบน static host |
| 2026-04-27 | ORM / DB Access | Prisma vs Drizzle vs Supabase client | **Supabase JS client** | ลด dependency, Supabase client cover use case ของ project ได้ |
| 2026-04-27 | Form Input Method | Chat-based multi-step vs LIFF Web App | **LIFF** สำหรับ form ซับซ้อน | Chat form error-prone, LIFF ให้ประสบการณ์ดีกว่า + validate client-side ได้ |
| 2026-04-27 | Role Management | Hardcode LINE userId vs DB | **DB (`line_users` table)** | ยืดหยุ่น — เพิ่ม/เปลี่ยน role ได้โดยไม่ redeploy |
| 2026-04-27 | Monorepo Structure | Single repo flat vs npm workspaces vs Turborepo | **npm workspaces** | เพียงพอสำหรับ 2 apps, ไม่ต้องการ Turborepo pipeline |
| 2026-04-27 | Multi-tenant | รองรับหลาย org vs single org | **Single org (v1)** | ลด complexity |
| 2026-04-27 | Attendance UI | เลือกพนักงานก่อนแล้ว LIFF vs ตารางพนักงานทั้งหมดใน LIFF | **ตารางใน LIFF** | เร็วกว่า — เสมียนเห็นพนักงานทุกคนในหน้าเดียว |
| 2026-04-28 | DB Primary Key | UUID vs int identity | **int generated always as identity** | ง่ายกว่า, เพียงพอสำหรับ single org, URL ดูอ่านได้ง่ายกว่า |
| 2026-04-28 | Employee wage model | wage_type (daily/monthly) + rate_daily + rate_monthly vs wage เดียว | **wage (รายวัน) เพียงอย่างเดียว** | ทีมนี้พนักงานทุกคนเป็นรายวัน ไม่ต้องการ wage_type ใน v1 |
| 2026-04-28 | ot_rate | SQL GENERATED COLUMN vs คำนวณใน app | **คำนวณใน app service** (`wage/8×1.5`) | ไม่ต้องการ GENERATED column ที่ sync ยาก, บันทึกลง DB ตอน insert/update |
| 2026-04-28 | Period status | `status enum (open/locked)` vs `is_active boolean` | **is_active boolean** | เรียบง่ายกว่าสำหรับ v1 ที่มีแค่ 2 state |
| 2026-04-28 | Active period logic | is_active flag เท่านั้น vs date range เท่านั้น vs ทั้งคู่ | **ทั้งคู่**: `is_active=true AND today BETWEEN start..end` | ป้องกัน period เก่าที่ยังไม่ปิด ขึ้นมาผิดพลาด |
| 2026-04-28 | hours_worked | SQL GENERATED ALWAYS vs application layer | **application layer** | ลด coupling กับ DB schema, คำนวณตอน display/report เท่านั้น |
| 2026-04-28 | OT input UI | 1 decimal input vs 2 inputs (ชม./น.) | **2 inputs ชม./น.** | UX ดีกว่า ไม่ต้องพิมพ์ทศนิยม, convert เป็น decimal ตอน submit |
| 2026-04-28 | Attendance flow | redirect ไป /periods/new ทันที vs empty state + ปุ่ม | **empty state + ปุ่ม** | ผู้ใช้เห็น context ว่าทำไมถึงต้องสร้างงวด ก่อนจะ navigate |
| 2026-04-28 | Work logs | work_logs table (uuid[] responsible) vs tasks table (text employee_ids) | **tasks table (text employee_ids)** | schema จริงที่ implement ใช้ text comma-separated ไม่ใช่ uuid[] |

---

> เพิ่มแถวใหม่ทุกครั้งที่มี decision สำคัญ — format: `| วันที่ | หัวข้อ | ทางเลือก | เลือก | เหตุผล |`
