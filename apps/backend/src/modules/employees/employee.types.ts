export type { Employee } from '../../models/employee.model.js';

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  wage: number;
}
