export type { Period } from '../../models/period.model.js';

export interface CreatePeriodDto {
  start_date: string;
  end_date: string;
}
