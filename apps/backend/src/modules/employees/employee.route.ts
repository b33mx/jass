import { Router } from 'express';
import {
  handleGetAllEmployees,
  handleCreateEmployee,
  handleGetEmployeeById,
  handleUpdateEmployee,
} from './employee.controller.ts';

export const employeeRouter = Router();

employeeRouter.get('/', handleGetAllEmployees);
employeeRouter.post('/', handleCreateEmployee);
employeeRouter.get('/:id', handleGetEmployeeById);
employeeRouter.patch('/:id', handleUpdateEmployee);
