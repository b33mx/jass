import { replyToLine } from '../client.js';
import { createAttendanceFlexMessage } from '../messages/attendance-menu.js';
import { createEmployeeFlexMessage } from '../messages/employee-menu.js';
import { createPayrollFlexMessage } from '../messages/payroll-menu.js';
import { createPeriodFlexMessage } from '../messages/period-menu.js';
import type { LineEvent } from '../types.js';
import { env } from '../../../config/env.js';
import { getAllEmployees } from '../../../modules/employees/employee.service.js';
import { getActivePeriod } from '../../../modules/periods/period.service.js';
import { handleUserFollow } from '../../../modules/line-users/line-user.service.js';
import { getLineUserByLineId } from '../../../modules/line-users/line-user.repository.js';
import { buildReportUrl, createReportToken } from '../../../modules/reports/report-link-token.js';
import { getPublicBaseUrl } from '../../../lib/public-url.js';

const TRIGGER_MENU = '>พนักงาน';
const TRIGGER_LIST = '>รายชื่อ';
const TRIGGER_ATTENDANCE = '>ลงเวลา';
const TRIGGER_PAYROLL = '>เงินเดือน';
const TRIGGER_PERIOD = '>งวด';

function todayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export async function handleLineEvent(event: LineEvent): Promise<void> {
  if (event.type === 'follow') {
    const lineUserId = event.source?.userId;
    if (lineUserId) await handleUserFollow(lineUserId);
    return;
  }

  if (event.type !== 'message') return;
  if (event.message?.type !== 'text' || !event.replyToken) return;

  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  const lineUser = await getLineUserByLineId(lineUserId);
  if (!lineUser?.company_id) {
    await replyToLine(event.replyToken, [{ type: 'text', text: 'กรุณาติดต่อ admin เพื่อตั้งค่าเบื้องต้น' }]);
    return;
  }
  const companyId = lineUser.company_id;

  const userText = event.message.text?.trim();

  if (userText === TRIGGER_MENU) {
    await replyToLine(event.replyToken, [createEmployeeFlexMessage(env.LIFF_ID)]);
    return;
  }

  if (userText === TRIGGER_ATTENDANCE) {
    const token = createReportToken({
      kind: 'work',
      date: todayInTimezone(env.TZ),
      companyId,
    });
    await replyToLine(event.replyToken, [
      createAttendanceFlexMessage(env.LIFF_ID, buildReportUrl(getPublicBaseUrl(), token)),
    ]);
    return;
  }

  if (userText === TRIGGER_PAYROLL) {
    await replyToLine(event.replyToken, [createPayrollFlexMessage(env.LIFF_ID)]);
    return;
  }

  if (userText === TRIGGER_PERIOD) {
    const active = await getActivePeriod(companyId);
    let activePeriodLabel: string | undefined;
    if (active) {
      const fmt = (s: string) =>
        new Date(s + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      activePeriodLabel = `${fmt(active.start_date)} – ${fmt(active.end_date)}`;
    }
    await replyToLine(event.replyToken, [createPeriodFlexMessage(env.LIFF_ID, activePeriodLabel)]);
    return;
  }

  if (userText === TRIGGER_LIST) {
    const employees = await getAllEmployees(companyId);
    const text =
      employees.length === 0
        ? 'ยังไม่มีพนักงานในระบบ'
        : 'รายชื่อพนักงาน\n' +
          employees.map((e, i) => `${i + 1}. ${e.first_name} ${e.last_name}`).join('\n');

    await replyToLine(event.replyToken, [{ type: 'text', text }]);
  }
}
