export type { Employee } from '../../models/employee.model.ts';

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  wage: number;
}
