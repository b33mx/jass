export interface WageHistory {
  id: number;
  employee_id: number;
  company_id: number;
  wage: number;
  ot_rate: number;
  effective_from: string;
  note: string | null;
  created_at: string;
}

export interface AddWageHistoryDto {
  wage: number;
  effectiveFrom: string;
  note?: string;
}
