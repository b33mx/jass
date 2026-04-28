export type { Attendance } from '../../models/attendance.model.ts';

export interface CreateAttendanceDto {
  attendance_date: string;
  employee_id: number;
  period_id: number;
  morning_check?: boolean;
  afternoon_check?: boolean;
  ot?: number;
}

export interface UpdateAttendanceDto {
  morning_check?: boolean;
  afternoon_check?: boolean;
  ot?: number;
}

export interface BatchAttendanceRecord {
  employee_id: number;
  morning_check?: boolean;
  afternoon_check?: boolean;
  ot?: number;
}

export interface BatchAttendanceDto {
  period_id: number;
  attendance_date: string;
  records: BatchAttendanceRecord[];
}
