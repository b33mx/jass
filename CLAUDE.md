# CLAUDE.md — JASS Project Rules

อ่านก่อนทำงานทุกครั้ง Context เต็มอยู่ที่ `doct/CONTEXT.md`

---

## Critical: Date / Timezone

ระบบทำงานใน **UTC+7 (Asia/Bangkok)** ทั้ง frontend (browser) และ backend (server ที่ deploy ใน TH timezone)

### ห้ามทำ

```ts
// ❌ local Date → toISOString() = UTC → ได้วันที่ผิด 1 วัน
new Date('2026-04-20T00:00:00').toISOString().slice(0, 10)
// ผล: '2026-04-19'  (April 20 local = April 19 17:00 UTC)
```

### ให้ทำ — สร้าง YYYY-MM-DD จาก local Date

```ts
// ✅ ใช้ local date getters เสมอเมื่อ Date ถูกสร้างด้วย local time
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

### Pattern ที่ปลอดภัย

| Use case | Pattern | เหตุผล |
|----------|---------|--------|
| loop วันในงวด (frontend/backend local TZ) | `new Date(str + 'T00:00:00')` + local getters | สร้าง local → export local |
| loop วันในงวด (backend UTC) | `new Date(str)` + `toISOString()` | date-only string = UTC, อ่าน/เขียน UTC ตลอด |
| แสดงวันภาษาไทย | `new Date(str + 'T00:00:00').toLocaleDateString('th-TH', ...)` | local midnight → local display |
| "today" ใน frontend | local getters (ไม่ใช่ `toISOString()`) | ป้องกัน before-7am bug |
| compare date strings | string comparison `'2026-04-20' <= '2026-05-05'` ได้เลย | ISO format เรียงลำดับได้ |

### ไฟล์ที่ระวังเป็นพิเศษ

- `apps/web/src/pages/AttendanceOverviewPage.tsx` — `eachDayInRange` ใช้ local getters แล้ว
- `apps/backend/src/modules/reports/report.work.service.ts` — `datesInRange` ใช้ local getters แล้ว
- `apps/backend/src/modules/attendance/attendance.service.ts` — `eachDayInRange` ใช้ `new Date(str)` (UTC) + `toISOString()` — อย่าเปลี่ยนไปใส่ `'T00:00:00'`

---

## Conventions (ย่อ)

- DB access ผ่าน repository layer เท่านั้น
- Service = pure business logic, ไม่รู้จัก HTTP/LINE
- API response = direct data, ไม่ wrap `{ success, data }`
- TypeScript strict mode ทั้งสอง app
- Backend ESM — import ต้องมี `.ts` extension

ดู `doct/CONTEXT.md` สำหรับ decisions ทั้งหมดที่ผ่านการพิจารณาแล้ว
