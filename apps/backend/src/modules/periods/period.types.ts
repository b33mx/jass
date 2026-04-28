export type { Period } from '../../models/period.model.ts';

export interface CreatePeriodDto {
  start_date: string;
  end_date: string;
}
