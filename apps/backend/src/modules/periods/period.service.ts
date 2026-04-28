import { insertPeriod, selectActivePeriod, selectAllPeriods, selectPeriodById } from './period.repository.ts';
import type { CreatePeriodDto, Period } from './period.types.ts';

export async function getActivePeriod(): Promise<Period | null> {
  const today = new Date().toISOString().slice(0, 10);
  return selectActivePeriod(today);
}

export async function createPeriod(dto: CreatePeriodDto): Promise<Period> {
  return insertPeriod({ start_date: dto.start_date, end_date: dto.end_date });
}

export async function getPeriodById(id: number): Promise<Period | null> {
  return selectPeriodById(id);
}

export async function getAllPeriods(): Promise<Period[]> {
  return selectAllPeriods();
}
