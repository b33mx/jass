import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectActivePeriod } from '../periods/period.repository.js';
import { selectAttendanceByPeriodId } from '../attendance/attendance.repository.js';
import { selectAllEmployees } from '../employees/employee.repository.js';
import { getTasksByDateRange } from '../tasks/task.repository.js';
import type { Attendance } from '../../models/attendance.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Regular.ttf');
const FONT_B = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Bold.ttf');

const M = 28;
const PAGE_W = 841.89; // A4 landscape
const PAGE_H = 595.28;
const CW = PAGE_W - M * 2;

const C = {
  headerBg: '#7F1D1D',
  section: '#B91C1C',
  border: '#FCA5A5',
  text: '#111827',
  muted: '#6B7280',
  red: '#DC2626',
} as const;

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const fin = new Date(end + 'T00:00:00');
  while (cur <= fin) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function shortThaiDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function attValue(att?: Attendance): number {
  if (!att) return 0;
  if (att.morning_check && att.afternoon_check) return 1;
  if (att.morning_check || att.afternoon_check) return 0.5;
  return 0;
}

function pageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PAGE_H - M) {
    doc.addPage();
    return M;
  }
  return y;
}

export async function generateWorkReport(date: string): Promise<Buffer> {
  const period = await selectActivePeriod(date);
  if (!period) throw new Error('ไม่พบงวดที่เปิดอยู่สำหรับวันที่นี้');

  const [allAtt, employees, tasks] = await Promise.all([
    selectAttendanceByPeriodId(period.period_id),
    selectAllEmployees(),
    getTasksByDateRange(period.start_date, period.end_date),
  ]);

  const dates = datesInRange(period.start_date, period.end_date);
  const empMap = new Map(employees.map((e) => [e.employee_id, e]));
  const attLookup = new Map<number, Map<string, Attendance>>();
  for (const a of allAtt) {
    if (!attLookup.has(a.employee_id)) attLookup.set(a.employee_id, new Map());
    attLookup.get(a.employee_id)?.set(a.attendance_date, a);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    doc.registerFont('Regular', FONT);
    doc.registerFont('Bold', FONT_B);

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Page 1
    doc.fillColor(C.headerBg).rect(0, 0, PAGE_W, 64).fill();
    doc.font('Bold').fontSize(14).fillColor('white')
      .text('รายงานการทำงาน', M, 18);
    doc.font('Regular').fontSize(10).fillColor('#FECACA')
      .text(`งวด ${shortThaiDate(period.start_date)} - ${shortThaiDate(period.end_date)}`, M, 40);

    let y = 84;
    doc.font('Bold').fontSize(11).fillColor(C.section).text('หน้า 1: สรุปการเข้างาน', M, y);
    y += 20;

    const nameW = 160;
    const dayW = Math.max(18, Math.min(28, (CW - nameW - 90 - 70) / Math.max(dates.length, 1)));
    const laborW = 90;
    const otW = 70;

    // Header row
    let x = M;
    const rowH = 22;
    doc.fillColor('#FEE2E2').rect(M, y, CW, rowH).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, rowH).stroke();
    doc.font('Bold').fontSize(9).fillColor(C.text);
    doc.text('ชื่อ', x + 4, y + 6, { width: nameW - 8, align: 'left', lineBreak: false });
    x += nameW;
    dates.forEach((d) => {
      const day = new Date(d + 'T00:00:00').getDate();
      doc.text(String(day), x, y + 6, { width: dayW, align: 'center', lineBreak: false });
      x += dayW;
    });
    doc.text('แรง', x, y + 6, { width: laborW, align: 'center', lineBreak: false });
    x += laborW;
    doc.text('OT', x, y + 6, { width: otW, align: 'center', lineBreak: false });
    y += rowH;

    // Data rows
    employees.forEach((emp, idx) => {
      y = pageBreak(doc, y, rowH);
      x = M;
      if (idx % 2 === 1) doc.fillColor('#FFFBEB').rect(M, y, CW, rowH).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(M, y, CW, rowH).stroke();
      doc.font('Regular').fontSize(8.5).fillColor(C.text)
        .text(`${emp.first_name} ${emp.last_name}`, x + 4, y + 6, { width: nameW - 8, lineBreak: false });
      x += nameW;

      let labor = 0;
      let ot = 0;
      dates.forEach((d) => {
        const att = attLookup.get(emp.employee_id)?.get(d);
        const v = attValue(att);
        labor += v;
        ot += att?.ot ?? 0;
        const color = v === 0 ? C.red : C.text;
        doc.font('Bold').fontSize(8.5).fillColor(color)
          .text(String(v), x, y + 6, { width: dayW, align: 'center', lineBreak: false });
        x += dayW;
      });

      doc.font('Bold').fontSize(8.5).fillColor(C.text)
        .text(String(labor), x, y + 6, { width: laborW, align: 'center', lineBreak: false });
      x += laborW;
      doc.font('Regular').fontSize(8.5).fillColor(C.text)
        .text(ot > 0 ? String(ot) : '-', x, y + 6, { width: otW, align: 'center', lineBreak: false });
      y += rowH;
    });

    // Page 2: OT summary
    doc.addPage();
    doc.fillColor(C.headerBg).rect(0, 0, PAGE_W, 64).fill();
    doc.font('Bold').fontSize(14).fillColor('white')
      .text('รายงานการทำงาน (สรุป OT)', M, 18);
    doc.font('Regular').fontSize(10).fillColor('#FECACA')
      .text(`งวด ${shortThaiDate(period.start_date)} - ${shortThaiDate(period.end_date)}`, M, 40);

    y = 84;
    doc.font('Bold').fontSize(11).fillColor(C.section).text('หน้า 2: สรุป OT', M, y);
    y += 20;

    const otNameW = 160;
    const otDayW = Math.max(18, Math.min(28, (CW - otNameW - 90) / Math.max(dates.length, 1)));
    const otTotalW = 90;
    const otRowH = 22;

    let x2 = M;
    doc.fillColor('#FEE2E2').rect(M, y, CW, otRowH).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, otRowH).stroke();
    doc.font('Bold').fontSize(9).fillColor(C.text);
    doc.text('ชื่อ', x2 + 4, y + 6, { width: otNameW - 8, align: 'left', lineBreak: false });
    x2 += otNameW;
    dates.forEach((d) => {
      const day = new Date(d + 'T00:00:00').getDate();
      doc.text(String(day), x2, y + 6, { width: otDayW, align: 'center', lineBreak: false });
      x2 += otDayW;
    });
    doc.text('OT รวม', x2, y + 6, { width: otTotalW, align: 'center', lineBreak: false });
    y += otRowH;

    employees.forEach((emp, idx) => {
      y = pageBreak(doc, y, otRowH);
      x2 = M;
      if (idx % 2 === 1) doc.fillColor('#FFFBEB').rect(M, y, CW, otRowH).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(M, y, CW, otRowH).stroke();
      doc.font('Regular').fontSize(8.5).fillColor(C.text)
        .text(`${emp.first_name} ${emp.last_name}`, x2 + 4, y + 6, { width: otNameW - 8, lineBreak: false });
      x2 += otNameW;

      let totalOt = 0;
      dates.forEach((d) => {
        const att = attLookup.get(emp.employee_id)?.get(d);
        const otVal = att?.ot ?? 0;
        totalOt += otVal;
        doc.font('Regular').fontSize(8.5).fillColor(otVal > 0 ? C.section : C.muted)
          .text(otVal > 0 ? String(otVal) : '-', x2, y + 6, { width: otDayW, align: 'center', lineBreak: false });
        x2 += otDayW;
      });

      doc.font('Bold').fontSize(8.5).fillColor(totalOt > 0 ? C.section : C.text)
        .text(totalOt > 0 ? String(totalOt) : '-', x2, y + 6, { width: otTotalW, align: 'center', lineBreak: false });
      y += otRowH;
    });

    // Page 3: work items
    doc.addPage();
    doc.fillColor(C.headerBg).rect(0, 0, PAGE_W, 64).fill();
    doc.font('Bold').fontSize(14).fillColor('white')
      .text('รายงานการทำงาน (งานที่ทำ)', M, 18);
    doc.font('Regular').fontSize(10).fillColor('#FECACA')
      .text(`งวด ${shortThaiDate(period.start_date)} - ${shortThaiDate(period.end_date)}`, M, 40);

    y = 84;
    doc.font('Bold').fontSize(11).fillColor(C.section).text('หน้า 3: วันที่ | งานที่ทำ | ผู้รับผิดชอบ', M, y);
    y += 20;

    const c1 = 120;
    const c2 = 430;
    const c3 = CW - c1 - c2;
    const hdrH = 22;

    doc.fillColor('#FEE2E2').rect(M, y, CW, hdrH).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, hdrH).stroke();
    doc.font('Bold').fontSize(9).fillColor(C.text);
    doc.text('วันที่', M + 4, y + 6, { width: c1 - 8, align: 'left', lineBreak: false });
    doc.text('งานที่ทำ', M + c1 + 4, y + 6, { width: c2 - 8, align: 'left', lineBreak: false });
    doc.text('ผู้รับผิดชอบ', M + c1 + c2 + 4, y + 6, { width: c3 - 8, align: 'left', lineBreak: false });
    y += hdrH;

    const sorted = [...tasks].sort((a, b) => {
      if (a.task_date === b.task_date) return a.task.localeCompare(b.task);
      return a.task_date.localeCompare(b.task_date);
    });

    if (sorted.length === 0) {
      doc.font('Regular').fontSize(10).fillColor(C.muted).text('ไม่มีข้อมูลงานในงวดนี้', M + 4, y + 10);
      doc.end();
      return;
    }

    sorted.forEach((t, idx) => {
      const ids = t.employee_ids.split(',').map(Number).filter(Boolean);
      const names = ids.map((id) => empMap.get(id)?.first_name).filter(Boolean).join(', ');
      const timeStr = t.start_time && t.end_time ? ` (${t.start_time} - ${t.end_time})` : '';
      const detail = t.detail?.trim() ? `\n- ${t.detail.trim()}` : '';
      const taskText = `${t.task}${timeStr}${detail}`;

      const bodyH = Math.max(
        22,
        Math.max(
          doc.heightOfString(shortThaiDate(t.task_date), { width: c1 - 8 }),
          doc.heightOfString(taskText, { width: c2 - 8 }),
          doc.heightOfString(names || '-', { width: c3 - 8 })
        ) + 10
      );
      y = pageBreak(doc, y, bodyH);

      if (idx % 2 === 1) doc.fillColor('#FFFBEB').rect(M, y, CW, bodyH).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(M, y, CW, bodyH).stroke();

      doc.font('Regular').fontSize(9).fillColor(C.text);
      doc.text(shortThaiDate(t.task_date), M + 4, y + 6, { width: c1 - 8 });
      doc.text(taskText, M + c1 + 4, y + 6, { width: c2 - 8 });
      doc.text(names || '-', M + c1 + c2 + 4, y + 6, { width: c3 - 8 });
      y += bodyH;
    });

    doc.end();
  });
}
