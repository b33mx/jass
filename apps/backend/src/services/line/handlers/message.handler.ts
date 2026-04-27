import { replyToLine } from '../client.ts';
import { createEmployeeFlexMessage } from '../messages/employee-menu.ts';
import type { LineEvent } from '../types.ts';

const EMPLOYEE_MENU_TRIGGER = '>พนักงาน';

export async function handleLineEvent(event: LineEvent): Promise<void> {
  if (event.type !== 'message') {
    return;
  }

  if (event.message?.type !== 'text' || !event.replyToken) {
    return;
  }

  const userText = event.message.text?.trim();

  if (userText !== EMPLOYEE_MENU_TRIGGER) {
    return;
  }

  await replyToLine(event.replyToken, [createEmployeeFlexMessage()]);
}
