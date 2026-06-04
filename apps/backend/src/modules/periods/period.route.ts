import { Router } from 'express';
import {
  handleCalculatePayroll,
  handleClosePeriod,
  handleCreatePeriod,
  handleDeletePeriod,
  handleGetActivePeriod,
  handleGetAllPeriods,
  handleUpdatePeriod,
} from './period.controller.js';

export const periodRouter = Router();

periodRouter.get('/', handleGetAllPeriods);
periodRouter.get('/active', handleGetActivePeriod);
periodRouter.post('/', handleCreatePeriod);
periodRouter.patch('/:id', handleUpdatePeriod);
periodRouter.delete('/:id', handleDeletePeriod);
periodRouter.post('/:id/calculate', handleCalculatePayroll);
periodRouter.post('/:id/close', handleClosePeriod);
