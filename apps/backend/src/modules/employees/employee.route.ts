import { Router } from 'express';
import {
  handleGetAllEmployees,
  handleCreateEmployee,
  handleDeleteEmployee,
  handleGetEmployeeById,
  handleUpdateEmployee,
} from './employee.controller.js';

export const employeeRouter = Router();

employeeRouter.get('/', handleGetAllEmployees);
employeeRouter.post('/', handleCreateEmployee);
employeeRouter.get('/:id', handleGetEmployeeById);
employeeRouter.patch('/:id', handleUpdateEmployee);
employeeRouter.delete('/:id', handleDeleteEmployee);
