import { Router } from 'express';
import { handleCreatePeriod, handleGetActivePeriod, handleGetAllPeriods } from './period.controller.ts';

export const periodRouter = Router();

periodRouter.get('/', handleGetAllPeriods);
periodRouter.get('/active', handleGetActivePeriod);
periodRouter.post('/', handleCreatePeriod);
