# Status: Payroll Flow (2026-05-05)

## Scope ที่ทำแล้ว

1. เพิ่ม trigger คำสั่ง LINE `>เงินเดือน`
- ตอบกลับ Flex menu หัวข้อ `เงินเดือน`
- มีปุ่ม `คำนวณเงินเดือน` เปิด LIFF path `/payroll`

2. เพิ่มหน้า LIFF/Web `คำนวณเงินเดือน` (`/payroll`)
- แสดงงวดเป็น Card แยกสถานะ:
  - `ยังไม่ปิดงวด` (ใช้ `is_active=true`)
  - `ปิดงวดแล้ว` (ใช้ `is_active=false`) แสดงผลอย่างเดียว
- Card ของ `ยังไม่ปิดงวด` มีปุ่ม:
  - `ดูบัตรลงเวลา`
  - `คำนวณเงินเดือน`

3. ปุ่ม `ดูบัตรลงเวลา` เปิด PDF viewer ในหน้าเดิม
- เพิ่ม API ใหม่ `GET /api/reports/timecard?period_id=<id>`
- หน้า `/payroll` แสดง `<iframe>` viewer inline (ไม่เด้งหน้าใหม่)
- PDF เป็นบัตรลงเวลารายคนตาม service เดิม (1 คน/หน้า)

4. ปุ่ม `คำนวณเงินเดือน`
- เรียก `POST /api/periods/:id/calculate`
- ระหว่างคำนวณขึ้น modal progress
- คำนวณเสร็จแสดง modal ผลลัพธ์:
  - ยอดรวมที่ต้องจ่าย
  - รายการแยกพนักงาน (วันทำงาน, OT, ยอดรวมรายคน)

5. ปรับหน้า Home ให้เข้าถึง flow ได้ง่าย
- เพิ่มปุ่ม `เงินเดือน` ลิงก์ไป `/payroll`

## Hold ตามที่กำหนด

1. ฟังก์ชัน `ปิดงวดแล้ว` ยังไม่ implement workflow เพิ่มเติม
- ยังไม่มี action ปุ่มหรือ lock/edit logic สำหรับงวดที่ปิด
- ตอนนี้แสดงสถานะอย่างเดียว

## ไฟล์ที่แก้

1. `apps/backend/src/services/line/handlers/message.handler.ts`
2. `apps/backend/src/services/line/messages/payroll-menu.ts` (ใหม่)
3. `apps/backend/src/modules/reports/report.controller.ts`
4. `apps/backend/src/modules/reports/report.route.ts`
5. `apps/web/src/api/period.api.ts`
6. `apps/web/src/pages/PayrollPage.tsx` (ใหม่)
7. `apps/web/src/pages/HomePage.tsx`
8. `apps/web/src/App.tsx`

