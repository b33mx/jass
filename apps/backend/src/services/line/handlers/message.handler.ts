import { replyToLine } from '../client.js';
import { createAttendanceFlexMessage } from '../messages/attendance-menu.js';
import { createEmployeeFlexMessage } from '../messages/employee-menu.js';
import { createPayrollFlexMessage } from '../messages/payroll-menu.js';
import type { LineEvent } from '../types.js';
import { env } from '../../../config/env.js';
import { getAllEmployees } from '../../../modules/employees/employee.service.js';
import { handleUserFollow } from '../../../modules/line-users/line-user.service.js';
import { getLineUserByLineId } from '../../../modules/line-users/line-user.repository.js';

const TRIGGER_MENU = '>พนักงาน';
const TRIGGER_LIST = '>รายชื่อ';
const TRIGGER_ATTENDANCE = '>ลงเวลา';
const TRIGGER_PAYROLL = '>เงินเดือน';

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
    await replyToLine(event.replyToken, [createAttendanceFlexMessage(env.LIFF_ID, env.API_BASE_URL)]);
    return;
  }

  if (userText === TRIGGER_PAYROLL) {
    await replyToLine(event.replyToken, [createPayrollFlexMessage(env.LIFF_ID)]);
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
