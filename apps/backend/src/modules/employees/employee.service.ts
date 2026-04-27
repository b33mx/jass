import { insertEmployee, selectAllEmployees, selectEmployeeById, updateEmployeeById } from './employee.repository.ts';
import type { CreateEmployeeDto, Employee } from './employee.types.ts';

function calcOtRate(wage: number): number {
  return parseFloat(((wage / 8) * 1.5).toFixed(2));
}

export async function createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
  return insertEmployee({
    first_name: dto.firstName,
    last_name: dto.lastName,
    wage: dto.wage,
    ot_rate: calcOtRate(dto.wage),
  });
}

export async function getAllEmployees(): Promise<Employee[]> {
  return selectAllEmployees();
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  return selectEmployeeById(id);
}

export async function updateEmployee(id: number, dto: CreateEmployeeDto): Promise<Employee> {
  return updateEmployeeById(id, {
    first_name: dto.firstName,
    last_name: dto.lastName,
    wage: dto.wage,
    ot_rate: calcOtRate(dto.wage),
  });
}
