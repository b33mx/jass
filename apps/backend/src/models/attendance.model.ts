export interface Attendance {
  attendance_id: number;
  attendance_date: string;
  employee_id: number;
  period_id: number;
  morning_check: boolean;
  afternoon_check: boolean;
  ot: number;
  leave_reason: string | null;
  created_at: string;
}
