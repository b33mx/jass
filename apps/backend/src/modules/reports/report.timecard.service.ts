import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectPeriodById } from '../periods/period.repository.js';
import { selectAttendanceByPeriodId } from '../attendance/attendance.repository.js';
import { selectAllEmployees } from '../employees/employee.repository.js';
import type { Attendance } from '../../models/attendance.model.js';
import type { Employee } from '../../models/employee.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Regular.ttf');
const FONT_B = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Bold.ttf');

const PAGE_W = 360;
const PAGE_H = 841.89;
const M = 18;
const CW = PAGE_W - M * 2;

const C = {
  headerBg: '#7F1D1D',
  section: '#B91C1C',
  border: '#FCA5A5',
  light: '#FEE2E2',
  text: '#111827',
  muted: '#6B7280',
  green: '#065F46',
  greenBg: '#D1FAE5',
  red: '#DC2626',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  stripe: '#FFFBEB',
} as const;

function shortThaiDate(d: string): string {
  const date = new Date(d + 'T00:00:00');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const fin = new Date(end + 'T00:00:00');
  while (cur <= fin) {
    const y = cur.getFullYear();
    const mo = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${mo}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function attDays(records: Attendance[]): number {
  let d = 0;
  for (const r of records) {
    d += (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0);
  }
  return d;
}

function attOt(records: Attendance[]): number {
  let o = 0;
  for (const r of records) o += r.ot ?? 0;
  return o;
}

function thb(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawPresenceMark(doc: PDFKit.PDFDocument, cx: number, cy: number, present: boolean, color: string) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.1);
  if (present) {
    doc.moveTo(cx - 3, cy + 0.5).lineTo(cx - 0.5, cy + 3).lineTo(cx + 4, cy - 3).stroke();
  } else {
    doc.moveTo(cx - 3, cy - 3).lineTo(cx + 3, cy + 3).stroke();
    doc.moveTo(cx + 3, cy - 3).lineTo(cx - 3, cy + 3).stroke();
  }
  doc.restore();
}

function drawEmployeePage(
  doc: PDFKit.PDFDocument,
  emp: Employee,
  records: Map<string, Attendance>,
  dates: string[],
  periodLabel: string,
  isFirst: boolean,
) {
  if (!isFirst) doc.addPage();

  // Header
  doc.fillColor(C.headerBg).rect(0, 0, PAGE_W, 58).fill();
  doc.font('Bold').fontSize(13).fillColor('white').text('บัตรลงเวลา', M, 14);
  doc.font('Regular').fontSize(11).fillColor('#FECACA').text(periodLabel, M, 32);

  // Employee info box
  let y = 68;
  doc.fillColor(C.light).rect(M, y, CW, 70).fill();
  doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, 70).stroke();

  doc.font('Bold').fontSize(13).fillColor(C.text)
    .text(`${emp.first_name} ${emp.last_name}`, M + 10, y + 22);

  const chipY = y + 42;
  const chipW = (CW - 30) / 2;
  doc.fillColor('#FFFFFF').rect(M + 10, chipY, chipW, 18).fill();
  doc.strokeColor(C.border).lineWidth(0.35).rect(M + 10, chipY, chipW, 18).stroke();
  doc.fillColor('#FFFFFF').rect(M + 20 + chipW, chipY, chipW, 18).fill();
  doc.strokeColor(C.border).lineWidth(0.35).rect(M + 20 + chipW, chipY, chipW, 18).stroke();

  doc.font('Regular').fontSize(9).fillColor(C.muted).text('ค่าแรง/วัน', M + 14, chipY + 5, { lineBreak: false });
  doc.font('Bold').fontSize(9.4).fillColor(C.text)
    .text(`${thb(emp.wage)} บ.`, M + 58, chipY + 5, { lineBreak: false });
  doc.font('Regular').fontSize(9).fillColor(C.muted).text('OT/ชม.', M + 24 + chipW, chipY + 5, { lineBreak: false });
  doc.font('Bold').fontSize(9.4).fillColor(C.text)
    .text(`${thb(emp.ot_rate)} บ.`, M + 58 + chipW, chipY + 5, { lineBreak: false });
  y += 78;

  // Table header
  const cols = {
    date: 96,
    am: 44,
    pm: 44,
    ot: 56,
    labor: CW - 96 - 44 - 44 - 56,
  };
  const tableW = cols.date + cols.am + cols.pm + cols.ot + cols.labor;
  const rowH = 15;

  doc.font('Bold').fontSize(10).fillColor(C.section).text('ตารางลงเวลา', M, y - 12);
  doc.fillColor(C.light).rect(M, y, tableW, rowH).fill();
  doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, tableW, rowH).stroke();
  doc.font('Bold').fontSize(9).fillColor(C.text);

  let x = M;
  doc.text('วันที่', x + 3, y + 3, { width: cols.date - 6, lineBreak: false });
  x += cols.date;
  doc.text('เช้า', x, y + 3, { width: cols.am, align: 'center', lineBreak: false });
  x += cols.am;
  doc.text('บ่าย', x, y + 3, { width: cols.pm, align: 'center', lineBreak: false });
  x += cols.pm;
  doc.text('OT', x, y + 3, { width: cols.ot, align: 'center', lineBreak: false });
  x += cols.ot;
  doc.text('แรง', x, y + 3, { width: cols.labor, align: 'center', lineBreak: false });
  let sepX = M + cols.date;
  [cols.am, cols.pm, cols.ot, cols.labor].forEach((w) => {
    doc.moveTo(sepX, y).lineTo(sepX, y + rowH).strokeColor(C.border).lineWidth(0.35).stroke();
    sepX += w;
  });
  y += rowH;

  // Data rows
  dates.forEach((dateStr, idx) => {
    const att = records.get(dateStr);
    if (idx % 2 === 1) doc.fillColor(C.stripe).rect(M, y, tableW, rowH).fill();
    doc.strokeColor(C.border).lineWidth(0.35).rect(M, y, tableW, rowH).stroke();

    x = M;
    doc.font('Regular').fontSize(8.4).fillColor(C.text)
      .text(shortThaiDate(dateStr), x + 3, y + 3, { width: cols.date - 6, lineBreak: false });
    x += cols.date;

    // AM check (drawn as vector to avoid font glyph issues)
    const amHasData = Boolean(att);
    const amPresent = Boolean(att?.morning_check);
    if (amHasData) {
      drawPresenceMark(doc, x + cols.am / 2, y + rowH / 2, amPresent, amPresent ? C.green : C.red);
    }
    x += cols.am;

    // PM check (drawn as vector to avoid font glyph issues)
    const pmHasData = Boolean(att);
    const pmPresent = Boolean(att?.afternoon_check);
    if (pmHasData) {
      drawPresenceMark(doc, x + cols.pm / 2, y + rowH / 2, pmPresent, pmPresent ? C.green : C.red);
    }
    x += cols.pm;

    // OT
    const otVal = att?.ot ?? 0;
    doc.font('Regular').fontSize(8.4).fillColor(otVal > 0 ? C.section : C.muted)
      .text(otVal > 0 ? String(otVal) : '-', x, y + 3, { width: cols.ot, align: 'center', lineBreak: false });
    x += cols.ot;

    const labor = (att?.morning_check ? 0.5 : 0) + (att?.afternoon_check ? 0.5 : 0);
    doc.font('Bold').fontSize(8.4).fillColor(C.text)
      .text(labor > 0 ? String(labor) : '-', x, y + 3, { width: cols.labor, align: 'center', lineBreak: false });
    sepX = M + cols.date;
    [cols.am, cols.pm, cols.ot, cols.labor].forEach((w) => {
      doc.moveTo(sepX, y).lineTo(sepX, y + rowH).strokeColor(C.border).lineWidth(0.3).stroke();
      sepX += w;
    });

    y += rowH;
  });

  // Summary box
  y += 12;
  const empRecords = Array.from(records.values());
  const daysWorked = attDays(empRecords);
  const otHours = attOt(empRecords);
  const basePay = daysWorked * emp.wage;
  const otPay = otHours * emp.ot_rate;
  const gross = basePay + otPay;

  const boxH = 90;
  // Guard: don't overflow page
  if (y + boxH > PAGE_H - M) {
    doc.addPage();
    y = M;
  }

  doc.fillColor(C.headerBg).rect(M, y, CW, 24).fill();
  doc.fillColor(C.light).rect(M, y + 24, CW, boxH - 24).fill();
  doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, boxH).stroke();

  const half = CW / 2;
  doc.font('Bold').fontSize(11).fillColor('white').text('สรุปผลรายคน', M + 10, y + 8);

  doc.font('Regular').fontSize(11).fillColor(C.text);
  doc.text(`วันทำงาน: ${daysWorked} วัน`, M + 10, y + 34, { lineBreak: false });
  doc.text(`OT รวม: ${otHours} ชม.`, M + 10 + half / 2, y + 34, { lineBreak: false });
  doc.text(`ค่าแรง: ${thb(basePay)} บาท`, M + 10, y + 52, { lineBreak: false });
  doc.text(`ค่า OT: ${thb(otPay)} บาท`, M + 10 + half / 2, y + 52, { lineBreak: false });

  doc.font('Bold').fontSize(13).fillColor(C.headerBg)
    .text(`รวมทั้งสิ้น: ${thb(gross)} บาท`, M + 10, y + 70, { lineBreak: false });
}

export async function generateTimecardReport(periodId: number): Promise<Buffer> {
  const period = await selectPeriodById(periodId);
  if (!period) throw Object.assign(new Error('ไม่พบงวด'), { status: 404 });

  const [allAtt, employees] = await Promise.all([
    selectAttendanceByPeriodId(periodId),
    selectAllEmployees(),
  ]);

  const dates = datesInRange(period.start_date, period.end_date);
  const periodLabel = `งวด ${shortThaiDate(period.start_date)} – ${shortThaiDate(period.end_date)}`;

  const attByEmployee = new Map<number, Map<string, Attendance>>();
  for (const a of allAtt) {
    if (!attByEmployee.has(a.employee_id)) attByEmployee.set(a.employee_id, new Map());
    attByEmployee.get(a.employee_id)!.set(a.attendance_date, a);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], layout: 'portrait', margin: 0 });
    doc.registerFont('Regular', FONT);
    doc.registerFont('Bold', FONT_B);

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    employees.forEach((emp, idx) => {
      const empRecords = attByEmployee.get(emp.employee_id) ?? new Map<string, Attendance>();
      drawEmployeePage(doc, emp, empRecords, dates, periodLabel, idx === 0);
    });

    doc.end();
  });
}
