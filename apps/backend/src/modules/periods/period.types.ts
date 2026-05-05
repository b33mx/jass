export type { Period } from '../../models/period.model.js';

export interface CreatePeriodDto {
  start_date: string;
  end_date: string;
}

export interface PayrollBreakdown {
  employee_id: number;
  first_name: string;
  last_name: string;
  wage: number;
  ot_rate: number;
  days_worked: number;
  ot_hours: number;
  gross: number;
}

export interface PayrollResult {
  period_id: number;
  start_date: string;
  end_date: string;
  total: number;
  breakdown: PayrollBreakdown[];
}
