import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectActivePeriod } from '../periods/period.repository.js';
import { selectAttendanceByPeriodAndDate } from '../attendance/attendance.repository.js';
import { selectAllEmployees } from '../employees/employee.repository.js';
import { getTasksByDate } from '../tasks/task.repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT   = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Regular.ttf');
const FONT_B = path.resolve(__dirname, '../../../assets/fonts/Sarabun-Bold.ttf');

const M      = 40;
const CW     = 515.28;
const PAGE_H = 841.89;

const C = {
  pageHdr: '#7F1D1D',
  tblHdr:  '#B91C1C',
  tblText: '#FEF08A',
  section: '#F59E0B',
  border:  '#FCA5A5',
  text:    '#111827',
  muted:   '#6B7280',
  dotOn:   '#16A34A',   // green-600
  dotOff:  '#DC2626',   // red-600
} as const;

const DOT_ON  = '__DOT_ON__';
const DOT_OFF = '__DOT_OFF__';

function drawCheck(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save().strokeColor(C.dotOn).lineWidth(1.8).lineCap('round')
    .moveTo(cx - 4, cy)
    .lineTo(cx - 1, cy + 3.5)
    .lineTo(cx + 4.5, cy - 4)
    .stroke().restore();
}

function drawCross(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save().strokeColor(C.dotOff).lineWidth(1.8).lineCap('round')
    .moveTo(cx - 4, cy - 4).lineTo(cx + 4, cy + 4).stroke()
    .moveTo(cx + 4, cy - 4).lineTo(cx - 4, cy + 4).stroke()
    .restore();
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

function thaiDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function shortDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function pageBreak(doc: PDFKit.PDFDocument, y: number, need: number): number {
  if (y + need > PAGE_H - M) { doc.addPage(); return M; }
  return y;
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, y: number): number {
  y = pageBreak(doc, y, 36);
  doc.fillColor(C.section).rect(M, y, 4, 17).fill();
  doc.font('Bold').fontSize(11).fillColor(C.text).text(title, M + 10, y + 2);
  return y + 28;
}

type Row = { cells: string[]; sub?: string };

function drawTable(
  doc: PDFKit.PDFDocument,
  y: number,
  cols: number[],
  headers: string[],
  rows: Row[],
): number {
  const PAD   = 7;
  const ROW_H = 26;
  const SUB_H = 14;
  const FS    = 9;

  // header
  doc.fillColor(C.tblHdr).rect(M, y, CW, ROW_H).fill();
  let cx = M;
  doc.font('Bold').fontSize(FS).fillColor(C.tblText);
  headers.forEach((h, i) => {
    doc.text(h, cx + PAD, y + 9, { width: cols[i] - PAD * 2, align: i === 0 ? 'left' : 'center', lineBreak: false });
    cx += cols[i];
  });
  y += ROW_H;

  // rows
  rows.forEach((row) => {
    const rh = ROW_H + (row.sub ? SUB_H : 0);
    y = pageBreak(doc, y, rh);

    cx = M;
    doc.font('Regular').fontSize(FS).fillColor(C.text);
    row.cells.forEach((cell, i) => {
      const cellCx = cx;
      if (cell === DOT_ON || cell === DOT_OFF) {
        const midX = cellCx + cols[i] / 2;
        const midY = y + ROW_H / 2;
        if (cell === DOT_ON) drawCheck(doc, midX, midY);
        else drawCross(doc, midX, midY);
      } else {
        doc.fillColor(C.text)
          .text(cell, cellCx + PAD, y + 9, { width: cols[i] - PAD * 2, align: i === 0 ? 'left' : 'center', lineBreak: false });
      }
      cx += cols[i];
    });

    if (row.sub) {
      doc.font('Regular').fontSize(8).fillColor(C.muted)
        .text(row.sub, M + PAD + 10, y + ROW_H, { width: cols[0] - PAD * 2 - 10, lineBreak: false });
    }

    doc.strokeColor(C.border).lineWidth(0.5)
      .moveTo(M, y + rh).lineTo(M + CW, y + rh).stroke();

    y += rh;
  });

  return y;
}

export async function generateDailyReport(date: string): Promise<Buffer> {
  const period = await selectActivePeriod(date);
  const [attendance, employees, tasks] = await Promise.all([
    period ? selectAttendanceByPeriodAndDate(period.period_id, date) : Promise.resolve([]),
    selectAllEmployees(),
    getTasksByDate(date),
  ]);

  const empMap = new Map(employees.map((e) => [e.employee_id, `${e.first_name} ${e.last_name}`]));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.registerFont('Regular', FONT);
    doc.registerFont('Bold', FONT_B);

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Page header ──────────────────────────────────────────────
    doc.fillColor(C.pageHdr).rect(0, 0, 595.28, 82).fill();
    doc.font('Bold').fontSize(15).fillColor('white')
      .text('รายงานสรุปการทำงานประจำวัน', M, 18, { width: CW });
    doc.font('Regular').fontSize(10).fillColor('rgba(255,255,255,0.65)')
      .text(thaiDate(date), M, 42);
    if (period) {
      doc.text(`งวด: ${shortDate(period.start_date)} – ${shortDate(period.end_date)}`, M, 57);
    }

    let y = 106;

    // ── Section 1: Attendance ────────────────────────────────────
    y = sectionHeader(doc, 'การเข้างาน', y);

    // # 28 | ชื่อ-นามสกุล 215 | เช้า 68 | บ่าย 68 | OT 136 = 515
    const attCols = [28, 215, 68, 68, 136];
    const attRows: Row[] = employees.length === 0
      ? [{ cells: ['', 'ไม่มีข้อมูลพนักงาน', '', '', ''] }]
      : employees.map((emp, i) => {
          const att = attendance.find((a) => a.employee_id === emp.employee_id);
          return {
            cells: [
              String(i + 1),
              `${emp.first_name} ${emp.last_name}`,
              att?.morning_check   ? DOT_ON : DOT_OFF,
              att?.afternoon_check ? DOT_ON : DOT_OFF,
              att?.ot ? `${att.ot} ชม.` : '–',
            ],
          };
        });

    y = drawTable(doc, y, attCols, ['#', 'ชื่อ-นามสกุล', 'เช้า', 'บ่าย', 'OT (ชม.)'], attRows);

    const present = attendance.filter((a) => a.morning_check || a.afternoon_check).length;
    const absent = employees.length - present;
    y += 8;
    doc.font('Regular').fontSize(9).fillColor(C.muted)
      .text(`มาทำงาน  ${present}  คน   |   หยุดงาน  ${absent}  คน`, M + 6, y);
    y += 28;

    // ── Section 2: Tasks ─────────────────────────────────────────
    y = sectionHeader(doc, 'งานที่ทำวันนี้', y);

    // งานที่ทำ 330 | ผู้รับผิดชอบ 185 = 515
    const taskCols = [330, 185];
    const taskRows: Row[] = tasks.length === 0
      ? [{ cells: ['ไม่มีข้อมูลงาน', '–'] }]
      : tasks.map((t) => {
          const ids = t.employee_ids.split(',').map(Number).filter(Boolean);
          const names = ids.map((id) => empMap.get(id)).filter(Boolean).join(', ');
          return { cells: [t.task, names || '–'], sub: t.detail || undefined };
        });

    y = drawTable(doc, y, taskCols, ['งานที่ทำ', 'ผู้รับผิดชอบ'], taskRows);
    y += 28;

    // ── Section 3: Images ────────────────────────────────────────
    const tasksWithImgs = tasks.filter((t) => t.images?.length > 0);
    if (tasksWithImgs.length === 0) { doc.end(); return; }

    const drawImages = async () => {
      y = sectionHeader(doc, 'รูปภาพประกอบ', y);

      const IMG_W = 160;
      const IMG_GAP = (CW - IMG_W * 3) / 2;

      for (const task of tasksWithImgs) {
        y = pageBreak(doc, y, 20);
        doc.font('Bold').fontSize(9).fillColor(C.text).text(task.task, M, y);
        y += 18;

        const buffers = await Promise.all(task.images.map((img) => fetchBuffer(img.public_url)));
        const valid = buffers.filter((b): b is Buffer => b !== null);

        let rowY = y;
        for (let i = 0; i < valid.length; i++) {
          const col = i % 3;
          if (col === 0) {
            if (i > 0) rowY += IMG_W + 8;
            rowY = pageBreak(doc, rowY, IMG_W + 8);
          }
          const imgX = M + col * (IMG_W + IMG_GAP);
          doc.strokeColor(C.border).lineWidth(0.5).rect(imgX, rowY, IMG_W, IMG_W).stroke();
          try {
            doc.image(valid[i], imgX, rowY, { fit: [IMG_W, IMG_W], align: 'center', valign: 'center' });
          } catch { /* skip */ }
        }

        y = rowY + IMG_W + 16;
      }

      doc.end();
    };

    drawImages().catch(reject);
  });
}
