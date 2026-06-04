import { Router } from 'express';
import {
  handleGetAllEmployees,
  handleCreateEmployee,
  handleDeleteEmployee,
  handleGetEmployeeById,
  handleUpdateEmployee,
} from './employee.controller.js';
import {
  handleGetWageHistory,
  handleAddWageHistory,
} from '../wage-history/wage-history.controller.js';

export const employeeRouter = Router();

employeeRouter.get('/', handleGetAllEmployees);
employeeRouter.post('/', handleCreateEmployee);
employeeRouter.get('/:id', handleGetEmployeeById);
employeeRouter.patch('/:id', handleUpdateEmployee);
employeeRouter.delete('/:id', handleDeleteEmployee);
employeeRouter.get('/:id/wage-history', handleGetWageHistory);
employeeRouter.post('/:id/wage-history', handleAddWageHistory);
