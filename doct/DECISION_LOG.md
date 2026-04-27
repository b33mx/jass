# JASS Payroll LINE OA — Decision Log

บันทึก decisions ที่ผ่านการคิดแล้ว — AI ไม่ต้อง propose ทางเลือกที่ถูก reject ไปแล้ว

---

| Date | Decision | Options ที่พิจารณา | เลือก | เหตุผล |
|------|----------|--------------------|-------|--------|
| 2026-04-27 | Database | Firebase Firestore vs Supabase (PostgreSQL) | **Supabase** | SQL เหมาะกับ payroll calculation มากกว่า (JOIN, aggregate, constraint), Supabase มี dashboard + migration built-in |
| 2026-04-27 | Frontend Framework | Next.js vs React + Vite | **React + Vite** | LIFF ไม่ต้องการ SSR, Vite เร็วกว่า, deploy ง่ายบน static host |
| 2026-04-27 | ORM / DB Access | Prisma vs Drizzle vs Supabase client | **Supabase JS client** | ลด dependency, Supabase client cover use case ของ project ได้, ไม่ต้องจัดการ migration framework ซ้อน |
| 2026-04-27 | Form Input Method | Chat-based multi-step vs LIFF Web App | **LIFF** สำหรับ form ซับซ้อน | Chat form error-prone (ผู้ใช้พิมพ์ผิดรูปแบบ), LIFF ให้ประสบการณ์ดีกว่า + validate client-side ได้ |
| 2026-04-27 | Role Management | Hardcode LINE userId vs LINE Group role vs DB | **DB (`line_users` table)** | ยืดหยุ่น — เพิ่ม/เปลี่ยน role ได้โดยไม่ redeploy |
| 2026-04-27 | hours_worked คำนวณที่ไหน | App layer vs SQL GENERATED COLUMN | **SQL GENERATED ALWAYS** | ลด bug จาก manual calculation, single source of truth, Supabase รองรับ GENERATED STORED |
| 2026-04-27 | Monorepo Structure | Single repo flat vs npm workspaces vs Turborepo | **npm workspaces** | เพียงพอสำหรับ 2 apps, ไม่ต้องการ Turborepo pipeline ในทีมเล็ก |
| 2026-04-27 | Multi-tenant | รองรับหลาย org vs single org | **Single org (v1)** | ลด complexity, ทีมเล็กไม่ต้องการ SaaS ใน v1 |
| 2026-04-27 | Attendance input model | check_in/check_out (time) vs shift_morning/shift_afternoon (boolean) | **shift boolean** | UI ที่ต้องการคือ checkbox เช้า/บ่าย ไม่ใช่กรอกเวลา — ตรงกับ workflow จริงของเสมียน |
| 2026-04-27 | Work log responsible | employee_id FK (1 คน) vs uuid[] array (หลายคน) vs junction table | **uuid[] array + GIN index** | 1 งานมีผู้รับผิดชอบหลายคน, array เพียงพอสำหรับ scale นี้, junction table overkill เกินไป |
| 2026-04-27 | Attendance UI flow | เลือกพนักงานก่อนแล้ว LIFF vs ตารางพนักงานทั้งหมดใน LIFF ทันที | **ตารางใน LIFF** | เร็วกว่า — เสมียนเห็นพนักงานทุกคนในหน้าเดียว tick พร้อมกันได้ |

---

> เพิ่มแถวใหม่ทุกครั้งที่มี decision สำคัญ — format: `| วันที่ | หัวข้อ | ทางเลือก | เลือก | เหตุผล |`
