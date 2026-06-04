import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectPeriodById } from '../periods/period.repository.js';
import { selectAttendanceByPeriodId } from '../attendance/attendance.repository.js';
import { selectAllEmployees } from '../employees/employee.repository.js';
import { selectWageHistoryForEmployees } from '../wage-history/wage-history.repository.js';
import { getTasksByDateRange } from '../tasks/task.repository.js';
import type { Attendance } from '../../models/attendance.model.js';
import type { Task } from '../../models/task.model.js';
import type { WageHistory } from '../wage-history/wage-history.types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Regular.ttf');
const FONT_B = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Bold.ttf');

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 34;
const CW = PAGE_W - M * 2;
const LAND_W = 841.89;
const LAND_H = 595.28;
const LAND_M = 28;
const LAND_CW = LAND_W - LAND_M * 2;

const C = {
  brand: '#7F1D1D',
  soft: '#FEE2E2',
  border: '#FCA5A5',
  text: '#111827',
  muted: '#6B7280',
  section: '#B91C1C',
  red: '#DC2626',
  stripe: '#FFFBEB',
} as const;

function formatThaiDate(d: string): string {
  const date = new Date(d + 'T00:00:00');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const fin = new Date(end + 'T00:00:00');
  while (cur <= fin) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function thb(n: number): string {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildWageHistoryMap(history: WageHistory[]): Map<number, WageHistory[]> {
  const map = new Map<number, WageHistory[]>();
  for (const h of history) {
    if (!map.has(h.employee_id)) map.set(h.employee_id, []);
    map.get(h.employee_id)!.push(h);
  }
  // each list is already ASC by effective_from from the query
  return map;
}

function getEffectiveRate(
  map: Map<number, WageHistory[]>,
  employeeId: number,
  date: string,
): { wage: number; ot_rate: number } {
  const history = map.get(employeeId) ?? [];
  let effective = history[0];
  for (const h of history) {
    if (h.effective_from <= date) effective = h;
    else break;
  }
  return effective ?? { wage: 0, ot_rate: 0 };
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function pageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PAGE_H - M) {
    doc.addPage();
    return M;
  }
  return y;
}

function drawSectionDivider(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.addPage();
  doc.fillColor('white').rect(0, 0, PAGE_W, PAGE_H).fill();
  doc.fillColor(C.brand).font('Bold').fontSize(34).text(title, M, PAGE_H / 2 - 38, { align: 'center', width: CW });
  doc.fillColor(C.muted).font('Bold').fontSize(14).text(subtitle, M, PAGE_H / 2 + 10, { align: 'center', width: CW });
}

function drawHeader(doc: PDFKit.PDFDocument, title: string, periodLabel: string) {
  doc.fillColor(C.brand).rect(0, 0, PAGE_W, 72).fill();
  doc.font('Bold').fontSize(18).fillColor('white').text(title, M, 18, { width: CW });
  doc.font('Bold').fontSize(11).fillColor('#FECACA').text(periodLabel, M, 46, { width: CW });
}

function drawHeaderLandscape(doc: PDFKit.PDFDocument, title: string, periodLabel: string) {
  doc.fillColor(C.brand).rect(0, 0, LAND_W, 72).fill();
  doc.font('Bold').fontSize(18).fillColor('white').text(title, LAND_M, 18, { width: LAND_CW });
  doc.font('Bold').fontSize(11).fillColor('#FECACA').text(periodLabel, LAND_M, 46, { width: LAND_CW });
}

function drawPresenceMark(doc: PDFKit.PDFDocument, cx: number, cy: number, present: boolean) {
  doc.save();
  doc.strokeColor(present ? '#065F46' : C.red).lineWidth(1.2);
  if (present) {
    doc.moveTo(cx - 3, cy + 0.5).lineTo(cx - 0.5, cy + 3).lineTo(cx + 4, cy - 3).stroke();
  } else {
    doc.moveTo(cx - 3, cy - 3).lineTo(cx + 3, cy + 3).stroke();
    doc.moveTo(cx + 3, cy - 3).lineTo(cx - 3, cy + 3).stroke();
  }
  doc.restore();
}

export async function generatePayrollPacketReport(periodId: number, companyId: number): Promise<Buffer> {
  const period = await selectPeriodById(periodId, companyId);
  if (!period) throw Object.assign(new Error('ไม่พบงวด'), { status: 404 });

  const [allAtt, employees, tasks] = await Promise.all([
    selectAttendanceByPeriodId(periodId),
    selectAllEmployees(companyId),
    getTasksByDateRange(period.start_date, period.end_date, companyId),
  ]);

  const wageHistoryRaw = await selectWageHistoryForEmployees(
    employees.map((e) => e.employee_id),
    companyId,
  );
  const wageHistoryMap = buildWageHistoryMap(wageHistoryRaw);

  const dates = datesInRange(period.start_date, period.end_date);
  const periodLabel = `งวด ${formatThaiDate(period.start_date)} - ${formatThaiDate(period.end_date)}`;

  const empMap = new Map(employees.map((e) => [e.employee_id, e]));
  const attLookup = new Map<number, Map<string, Attendance>>();
  for (const a of allAtt) {
    if (!attLookup.has(a.employee_id)) attLookup.set(a.employee_id, new Map());
    attLookup.get(a.employee_id)?.set(a.attendance_date, a);
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 0 });
    doc.registerFont('Regular', FONT);
    doc.registerFont('Bold', FONT_B);

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Page 1: Cover summary
    drawHeader(doc, 'รายงานสรุปเงินเดือน', periodLabel);
    let y = 94;
    doc.font('Bold').fontSize(17).fillColor(C.section).text('ใบปะหน้า: สรุปผลรายคน', M, y);
    y += 30;

    const cols = { name: 190, days: 72, ot: 70, amount: CW - 190 - 72 - 70 };
    const rowH = 36;
    doc.fillColor(C.soft).rect(M, y, CW, rowH).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, rowH).stroke();
    let x = M;
    doc.font('Bold').fontSize(16).fillColor(C.text);
    doc.text('พนักงาน', x + 6, y + 13, { width: cols.name - 12, lineBreak: false });
    x += cols.name;
    doc.text('แรง', x, y + 13, { width: cols.days, align: 'center', lineBreak: false });
    x += cols.days;
    doc.text('OT', x, y + 13, { width: cols.ot, align: 'center', lineBreak: false });
    x += cols.ot;
    doc.text('รวมเงิน', x, y + 13, { width: cols.amount, align: 'right', lineBreak: false });
    y += rowH;

    let grandTotal = 0;
    employees.forEach((emp, idx) => {
      y = pageBreak(doc, y, rowH);
      const records = Array.from((attLookup.get(emp.employee_id) ?? new Map()).values());
      const daysWorked = records.reduce((sum, r) => sum + (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0), 0);
      const otHours = records.reduce((sum, r) => sum + (r.ot ?? 0), 0);
      const gross = records.reduce((sum, r) => {
        const rate = getEffectiveRate(wageHistoryMap, emp.employee_id, r.attendance_date);
        const labor = (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0);
        return sum + labor * rate.wage + (r.ot ?? 0) * rate.ot_rate;
      }, 0);
      grandTotal += gross;

      if (idx % 2 === 1) doc.fillColor(C.stripe).rect(M, y, CW, rowH).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(M, y, CW, rowH).stroke();
      x = M;
      doc.font('Bold').fontSize(13.5).fillColor(C.text)
        .text(`${emp.first_name} ${emp.last_name}`, x + 6, y + 14, { width: cols.name - 12, lineBreak: false });
      x += cols.name;
      doc.font('Bold').fontSize(13.5).fillColor(C.text).text(String(daysWorked), x, y + 14, { width: cols.days, align: 'center', lineBreak: false });
      x += cols.days;
      doc.font('Bold').fontSize(13.5).fillColor(C.text).text(otHours > 0 ? String(otHours) : '-', x, y + 14, { width: cols.ot, align: 'center', lineBreak: false });
      x += cols.ot;
      doc.font('Bold').fontSize(13.5).fillColor(C.section).text(thb(gross), x, y + 14, { width: cols.amount - 8, align: 'right', lineBreak: false });
      y += rowH;
    });

    y += 12;
    doc.fillColor(C.soft).rect(M, y, CW, 44).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, y, CW, 44).stroke();
    doc.font('Bold').fontSize(14).fillColor(C.muted).text('ยอดรวมทั้งงวด', M + 10, y + 14);
    doc.font('Bold').fontSize(22).fillColor(C.brand).text(`${thb(grandTotal)} บาท`, M + 10, y + 9, { align: 'right', width: CW - 20 });

    // Section: timecards
    drawSectionDivider(doc, 'บัตรลงเวลารายคน', periodLabel);
    employees.forEach((emp) => {
      doc.addPage();
      drawHeader(doc, `บัตรลงเวลา: ${emp.first_name} ${emp.last_name}`, periodLabel);
      let ty = 94;

      doc.fillColor(C.soft).rect(M, ty, CW, 30).fill();
      doc.strokeColor(C.border).lineWidth(0.5).rect(M, ty, CW, 30).stroke();
      doc.font('Bold').fontSize(13).fillColor(C.text)
        .text(`ค่าแรง ${thb(emp.wage)} บาท/วัน | OT ${thb(emp.ot_rate)} บาท/ชม.`, M + 8, ty + 9);
      ty += 36;

      const tcols = { date: 114, am: 64, pm: 64, ot: 72, labor: CW - 114 - 64 - 64 - 72 };
      const trh = 32;
      doc.fillColor(C.soft).rect(M, ty, CW, trh).fill();
      doc.strokeColor(C.border).lineWidth(0.5).rect(M, ty, CW, trh).stroke();
      let tx = M;
      doc.font('Bold').fontSize(13.5).fillColor(C.text);
      doc.text('วันที่', tx + 4, ty + 12, { width: tcols.date - 8, lineBreak: false });
      tx += tcols.date;
      doc.text('เช้า', tx, ty + 12, { width: tcols.am, align: 'center', lineBreak: false });
      tx += tcols.am;
      doc.text('บ่าย', tx, ty + 12, { width: tcols.pm, align: 'center', lineBreak: false });
      tx += tcols.pm;
      doc.text('OT', tx, ty + 12, { width: tcols.ot, align: 'center', lineBreak: false });
      tx += tcols.ot;
      doc.text('แรง', tx, ty + 12, { width: tcols.labor, align: 'center', lineBreak: false });
      ty += trh;

      dates.forEach((d, idx) => {
        if (ty + trh > PAGE_H - M) {
          doc.addPage();
          drawHeader(doc, `บัตรลงเวลา: ${emp.first_name} ${emp.last_name}`, periodLabel);
          ty = 94;
          doc.fillColor(C.soft).rect(M, ty, CW, trh).fill();
          doc.strokeColor(C.border).lineWidth(0.5).rect(M, ty, CW, trh).stroke();
          let thx = M;
          doc.font('Bold').fontSize(13.5).fillColor(C.text);
          doc.text('วันที่', thx + 4, ty + 12, { width: tcols.date - 8, lineBreak: false });
          thx += tcols.date;
          doc.text('เช้า', thx, ty + 12, { width: tcols.am, align: 'center', lineBreak: false });
          thx += tcols.am;
          doc.text('บ่าย', thx, ty + 12, { width: tcols.pm, align: 'center', lineBreak: false });
          thx += tcols.pm;
          doc.text('OT', thx, ty + 12, { width: tcols.ot, align: 'center', lineBreak: false });
          thx += tcols.ot;
          doc.text('แรง', thx, ty + 12, { width: tcols.labor, align: 'center', lineBreak: false });
          ty += trh;
        }
        const att = attLookup.get(emp.employee_id)?.get(d);
        if (idx % 2 === 1) doc.fillColor(C.stripe).rect(M, ty, CW, trh).fill();
        doc.strokeColor(C.border).lineWidth(0.35).rect(M, ty, CW, trh).stroke();
        let cx = M;
        doc.font('Bold').fontSize(12.5).fillColor(C.text).text(formatThaiDate(d), cx + 4, ty + 10, { width: tcols.date - 8, lineBreak: false });
        cx += tcols.date;
        if (att) drawPresenceMark(doc, cx + tcols.am / 2, ty + trh / 2, Boolean(att.morning_check));
        cx += tcols.am;
        if (att) drawPresenceMark(doc, cx + tcols.pm / 2, ty + trh / 2, Boolean(att.afternoon_check));
        cx += tcols.pm;
        const otVal = att?.ot ?? 0;
        doc.font('Bold').fontSize(12.5).fillColor(otVal > 0 ? C.section : C.muted).text(otVal > 0 ? String(otVal) : '-', cx, ty + 10, { width: tcols.ot, align: 'center', lineBreak: false });
        cx += tcols.ot;
        const labor = (att?.morning_check ? 0.5 : 0) + (att?.afternoon_check ? 0.5 : 0);
        doc.font('Bold').fontSize(12.5).fillColor(C.text).text(labor > 0 ? String(labor) : '-', cx, ty + 10, { width: tcols.labor, align: 'center', lineBreak: false });
        ty += trh;
      });

      const records = Array.from((attLookup.get(emp.employee_id) ?? new Map()).values());
      const sumDays = records.reduce((sum, r) => sum + (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0), 0);
      const sumOt = records.reduce((sum, r) => sum + (r.ot ?? 0), 0);
      const wagePay = records.reduce((sum, r) => {
        const rate = getEffectiveRate(wageHistoryMap, emp.employee_id, r.attendance_date);
        const labor = (r.morning_check ? 0.5 : 0) + (r.afternoon_check ? 0.5 : 0);
        return sum + labor * rate.wage;
      }, 0);
      const otPay = records.reduce((sum, r) => {
        const rate = getEffectiveRate(wageHistoryMap, emp.employee_id, r.attendance_date);
        return sum + (r.ot ?? 0) * rate.ot_rate;
      }, 0);
      const sumPay = wagePay + otPay;

      if (ty + 46 > PAGE_H - M) {
        doc.addPage();
        drawHeader(doc, `บัตรลงเวลา: ${emp.first_name} ${emp.last_name}`, periodLabel);
        ty = 94;
      }
      doc.fillColor(C.soft).rect(M, ty + 8, CW, 88).fill();
      doc.strokeColor(C.border).lineWidth(0.5).rect(M, ty + 8, CW, 88).stroke();
      doc.font('Bold').fontSize(13).fillColor(C.section).text('สรุปผลรายคน', M + 8, ty + 14, { width: CW - 16 });
      doc.font('Bold').fontSize(12).fillColor(C.text).text(`แรงรวม ${sumDays} `, M + 8, ty + 33, { width: CW - 16 });
      doc.fillColor('#ffff80').roundedRect(M + 126, ty + 31, 126, 18, 6).fill();
      doc.font('Bold').fontSize(11).fillColor('#1e1e11').text(`${thb(wagePay)} บาท`, M + 133, ty + 35, { width: 112, lineBreak: false });

      doc.font('Bold').fontSize(12).fillColor(C.text).text(`OT ${sumOt} ชั่วโมง `, M + 8, ty + 52, { width: CW - 16 });
      doc.fillColor('#ffff80').roundedRect(M + 126, ty + 50, 126, 18, 6).fill();
      doc.font('Bold').fontSize(11).fillColor('#1e1e11').text(`${thb(otPay)} บาท`, M + 133, ty + 54, { width: 112, lineBreak: false });

      doc.font('Bold').fontSize(12).fillColor(C.text).text('คิดเป็นเงิน', M + 8, ty + 71, { width: CW - 16 });
      doc.fillColor('#BBF7D0').roundedRect(M + 86, ty + 69, 166, 18, 6).fill();
      doc.font('Bold').fontSize(11).fillColor('#14532D').text(`${thb(sumPay)} บาท`, M + 93, ty + 73, { width: 152, lineBreak: false });
    });

    // Section: period attendance matrix
    doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
    drawHeaderLandscape(doc, 'รายงานลงเวลารายงวด', periodLabel);
    let sy = 94;
    const sNameW = 200;
    const sDayW = Math.max(16, Math.min(24, (LAND_CW - sNameW - 110 - 72) / Math.max(dates.length, 1)));
    const sLaborW = 110;
    const sOtW = 72;
    const srh = 28;

    doc.fillColor(C.soft).rect(LAND_M, sy, LAND_CW, srh).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(LAND_M, sy, LAND_CW, srh).stroke();
    let sx = LAND_M;
    doc.font('Bold').fontSize(12.5).fillColor(C.text).text('พนักงาน', sx + 6, sy + 8, { width: sNameW - 12, lineBreak: false });
    sx += sNameW;
    dates.forEach((d) => {
      const day = new Date(d + 'T00:00:00').getDate();
      doc.text(String(day), sx, sy + 8, { width: sDayW, align: 'center', lineBreak: false });
      sx += sDayW;
    });
    doc.text('แรงรวม', sx, sy + 8, { width: sLaborW, align: 'center', lineBreak: false });
    sx += sLaborW;
    doc.text('OT', sx, sy + 8, { width: sOtW, align: 'center', lineBreak: false });
    sy += srh;

    employees.forEach((emp, idx) => {
      sy = pageBreak(doc, sy, srh);
      if (idx % 2 === 1) doc.fillColor(C.stripe).rect(LAND_M, sy, LAND_CW, srh).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(LAND_M, sy, LAND_CW, srh).stroke();
      sx = LAND_M;
      doc.font('Bold').fontSize(11.5).fillColor(C.text).text(`${emp.first_name} ${emp.last_name}`, sx + 6, sy + 8, { width: sNameW - 12, lineBreak: false });
      sx += sNameW;
      let laborSum = 0;
      let otSum = 0;
      dates.forEach((d) => {
        const att = attLookup.get(emp.employee_id)?.get(d);
        const v = (att?.morning_check ? 0.5 : 0) + (att?.afternoon_check ? 0.5 : 0);
        laborSum += v;
        otSum += att?.ot ?? 0;
        doc.font('Bold').fontSize(11.5).fillColor(v > 0 ? C.text : C.red).text(String(v), sx, sy + 8, { width: sDayW, align: 'center', lineBreak: false });
        sx += sDayW;
      });
      doc.font('Bold').fontSize(11.5).fillColor(C.text).text(String(laborSum), sx, sy + 8, { width: sLaborW, align: 'center', lineBreak: false });
      sx += sLaborW;
      doc.font('Bold').fontSize(11.5).fillColor(C.text).text(otSum > 0 ? String(otSum) : '-', sx, sy + 8, { width: sOtW, align: 'center', lineBreak: false });
      sy += srh;
    });

    // Section: OT summary table
    doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
    drawHeaderLandscape(doc, 'ตาราง OT รายคนรายวัน', periodLabel);
    let oy = 94;
    const oNameW = 220;
    const oDayW = Math.max(16, Math.min(24, (LAND_CW - oNameW - 98) / Math.max(dates.length, 1)));
    const oTotalW = 98;
    const orh = 28;
    doc.fillColor(C.soft).rect(LAND_M, oy, LAND_CW, orh).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(LAND_M, oy, LAND_CW, orh).stroke();
    let ox = LAND_M;
    doc.font('Bold').fontSize(12.5).fillColor(C.text).text('พนักงาน', ox + 6, oy + 8, { width: oNameW - 12, lineBreak: false });
    ox += oNameW;
    dates.forEach((d) => {
      const day = new Date(d + 'T00:00:00').getDate();
      doc.text(String(day), ox, oy + 8, { width: oDayW, align: 'center', lineBreak: false });
      ox += oDayW;
    });
    doc.text('OT รวม', ox, oy + 8, { width: oTotalW, align: 'center', lineBreak: false });
    oy += orh;

    employees.forEach((emp, idx) => {
      oy = pageBreak(doc, oy, orh);
      if (idx % 2 === 1) doc.fillColor(C.stripe).rect(LAND_M, oy, LAND_CW, orh).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(LAND_M, oy, LAND_CW, orh).stroke();
      ox = LAND_M;
      doc.font('Bold').fontSize(11.5).fillColor(C.text).text(`${emp.first_name} ${emp.last_name}`, ox + 6, oy + 8, { width: oNameW - 12, lineBreak: false });
      ox += oNameW;
      let totalOt = 0;
      dates.forEach((d) => {
        const otVal = attLookup.get(emp.employee_id)?.get(d)?.ot ?? 0;
        totalOt += otVal;
        doc.font('Bold').fontSize(11.5).fillColor(otVal > 0 ? C.section : C.muted).text(otVal > 0 ? String(otVal) : '-', ox, oy + 8, { width: oDayW, align: 'center', lineBreak: false });
        ox += oDayW;
      });
      doc.font('Bold').fontSize(11.5).fillColor(totalOt > 0 ? C.section : C.text).text(totalOt > 0 ? String(totalOt) : '-', ox, oy + 8, { width: oTotalW, align: 'center', lineBreak: false });
      oy += orh;
    });

    // Section: tasks + attachments (daily-report style)
    doc.addPage();
    drawHeader(doc, 'งานที่ทำ และไฟล์แนบ', periodLabel);
    let wy = 94;
    const wc1 = 90;
    const wc2 = 210;
    const wc3 = CW - wc1 - wc2;
    const wh = 20;
    doc.fillColor(C.soft).rect(M, wy, CW, wh).fill();
    doc.strokeColor(C.border).lineWidth(0.5).rect(M, wy, CW, wh).stroke();
    doc.font('Bold').fontSize(10).fillColor(C.text);
    doc.text('วันที่', M + 5, wy + 5, { width: wc1 - 10, lineBreak: false });
    doc.text('งานที่ทำ / คำอธิบาย', M + wc1 + 5, wy + 5, { width: wc2 - 10, lineBreak: false });
    doc.text('ผู้รับผิดชอบ', M + wc1 + wc2 + 5, wy + 5, { width: wc3 - 10, lineBreak: false });
    wy += wh;

    const sortedTasks = [...tasks].sort((a, b) => a.task_date.localeCompare(b.task_date));
    if (sortedTasks.length === 0) {
      doc.font('Bold').fontSize(12).fillColor(C.muted).text('ไม่มีงานในงวดนี้', M + 5, wy + 8);
      doc.end();
      return;
    }

    sortedTasks.forEach((t: Task, idx) => {
      const names = t.employee_ids
        .split(',')
        .map((id) => Number(id))
        .map((id) => empMap.get(id)?.first_name)
        .filter(Boolean)
        .join(', ');
      const detailText = t.detail ? `  ${t.detail}` : '';
      const rowH = Math.max(
        24,
        Math.max(
          doc.heightOfString(formatThaiDate(t.task_date), { width: wc1 - 10 }),
          doc.heightOfString(t.task, { width: wc2 - 10 })
            + (detailText ? doc.heightOfString(detailText, { width: wc2 - 10 }) + 2 : 0),
          doc.heightOfString(names || '-', { width: wc3 - 10 }),
        ) + 10,
      );
      wy = pageBreak(doc, wy, rowH);
      if (idx % 2 === 1) doc.fillColor(C.stripe).rect(M, wy, CW, rowH).fill();
      doc.strokeColor(C.border).lineWidth(0.35).rect(M, wy, CW, rowH).stroke();
      doc.font('Bold').fontSize(9.5).fillColor(C.text);
      doc.text(formatThaiDate(t.task_date), M + 5, wy + 5, { width: wc1 - 10 });
      const taskX = M + wc1 + 5;
      const taskY = wy + 5;
      doc.font('Bold').fontSize(9.5).fillColor(C.text).text(t.task, taskX, taskY, { width: wc2 - 10 });
      if (detailText) {
        const titleH = doc.heightOfString(t.task, { width: wc2 - 10 });
        doc.font('Regular').fontSize(9).fillColor(C.muted).text(detailText, taskX, taskY + titleH + 2, {
          width: wc2 - 10,
          indent: 10,
          indentAllLines: true,
        });
      }
      doc.text(names || '-', M + wc1 + wc2 + 5, wy + 5, { width: wc3 - 10 });
      wy += rowH;
    });

    const tasksWithImgs = sortedTasks.filter((t) => (t.images?.length ?? 0) > 0);
    if (tasksWithImgs.length > 0) {
      wy += 14;
      wy += 14;

      const IMG_W = 150;
      const IMG_GAP = (CW - IMG_W * 3) / 2;
      doc.addPage();
      drawHeader(doc, 'รูปภาพประกอบงาน', periodLabel);
      wy = 94;

      const drawImageTaskBlock = async (task: Task) => {
        doc.font('Bold').fontSize(11).fillColor(C.text).text(`${formatThaiDate(task.task_date)} - ${task.task}`, M, wy);
        wy += 18;

        const buffers = await Promise.all(task.images.map((img) => fetchBuffer(img.public_url)));
        const valid = buffers.filter((b): b is Buffer => b !== null);

        let rowY = wy;
        for (let i = 0; i < valid.length; i += 1) {
          const col = i % 3;
          if (col === 0) {
            if (i > 0) rowY += IMG_W + 8;
            rowY = pageBreak(doc, rowY, IMG_W + 8);
          }
          const imgX = M + col * (IMG_W + IMG_GAP);
          doc.strokeColor(C.border).lineWidth(0.5).rect(imgX, rowY, IMG_W, IMG_W).stroke();
          try {
            doc.image(valid[i], imgX, rowY, { fit: [IMG_W, IMG_W], align: 'center', valign: 'center' });
          } catch {
            // skip invalid image
          }
        }
        wy = rowY + IMG_W + 16;
      };

      const renderImages = async () => {
        for (const task of tasksWithImgs) {
          await drawImageTaskBlock(task);
        }
      };

      renderImages()
        .then(() => doc.end())
        .catch(reject);
      return;
    }

    doc.end();
  });
}
