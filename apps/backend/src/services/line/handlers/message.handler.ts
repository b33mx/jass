import { replyToLine } from '../client.js';
import { createAttendanceFlexMessage } from '../messages/attendance-menu.js';
import { createEmployeeFlexMessage } from '../messages/employee-menu.js';
import type { LineEvent } from '../types.js';
import { env } from '../../../config/env.js';
import { getAllEmployees } from '../../../modules/employees/employee.service.js';

const TRIGGER_MENU = '>พนักงาน';
const TRIGGER_LIST = '>รายชื่อ';
const TRIGGER_ATTENDANCE = '>ลงเวลา';

export async function handleLineEvent(event: LineEvent): Promise<void> {
  if (event.type !== 'message') return;
  if (event.message?.type !== 'text' || !event.replyToken) return;

  const userText = event.message.text?.trim();

  if (userText === TRIGGER_MENU) {
    await replyToLine(event.replyToken, [createEmployeeFlexMessage(env.LIFF_ID)]);
    return;
  }

  if (userText === TRIGGER_ATTENDANCE) {
    await replyToLine(event.replyToken, [createAttendanceFlexMessage(env.LIFF_ID, env.API_BASE_URL)]);
    return;
  }

  if (userText === TRIGGER_LIST) {
    const employees = await getAllEmployees();
    const text =
      employees.length === 0
        ? 'ยังไม่มีพนักงานในระบบ'
        : 'รายชื่อพนักงาน\n' +
          employees.map((e, i) => `${i + 1}. ${e.first_name} ${e.last_name}`).join('\n');

    await replyToLine(event.replyToken, [{ type: 'text', text }]);
  }
}
