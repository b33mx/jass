import { Router } from 'express';
import { handleCalculatePayroll, handleClosePeriod, handleCreatePeriod, handleGetActivePeriod, handleGetAllPeriods } from './period.controller.js';

export const periodRouter = Router();

periodRouter.get('/', handleGetAllPeriods);
periodRouter.get('/active', handleGetActivePeriod);
periodRouter.post('/', handleCreatePeriod);
periodRouter.post('/:id/calculate', handleCalculatePayroll);
periodRouter.post('/:id/close', handleClosePeriod);
