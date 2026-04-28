import { selectAllEmployees } from '../../../modules/employees/employee.repository.ts';
import { selectAttendanceByPeriodAndDate } from '../../../modules/attendance/attendance.repository.ts';
import { selectActivePeriod } from '../../../modules/periods/period.repository.ts';
import type { CreateTaskDto } from '../../../modules/tasks/task.types.ts';
import { broadcastToLine } from '../client.ts';

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function sendDailySummary(date: string, tasks: CreateTaskDto[]): Promise<void> {
  const period = await selectActivePeriod(date);
  if (!period) {
    console.warn(`[daily-summary] no active period for ${date}; skip LINE`);
    return;
  }

  const [attendance, employees] = await Promise.all([
    selectAttendanceByPeriodAndDate(period.period_id, date),
    selectAllEmployees(),
  ]);

  const employeeMap = new Map(employees.map((e) => [e.employee_id, e.first_name]));

  const present = attendance.filter((a) => a.morning_check || a.afternoon_check).length;
  const absent = attendance.filter((a) => !a.morning_check && !a.afternoon_check).length;

  const taskLines = tasks
    .map((t, i) => {
      const ids = t.employee_ids
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
      const names = ids
        .map((id) => employeeMap.get(id))
        .filter(Boolean)
        .join(', ');
      const detail = t.detail ? ` (${t.detail})` : '';
      const responsible = names ? `\n    👤 ${names}` : '';
      return `${i + 1}. ${t.task}${detail}${responsible}`;
    })
    .join('\n');

  const text = [
    `📋 สรุปการทำงานประจำวัน`,
    `🗓 ${formatThaiDate(date)}`,
    '',
    `✅ มาทำงาน  ${present} คน`,
    `❌ ขาดงาน   ${absent} คน`,
    '',
    '📝 งานที่ทำวันนี้',
    taskLines,
  ].join('\n');

  await broadcastToLine([{ type: 'text', text }]);
}
