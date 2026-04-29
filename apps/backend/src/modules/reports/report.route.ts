import { Router } from 'express';
import { handleCurrentWorkReport, handleDailyReport, handleWorkReport } from './report.controller.js';

export const reportRouter = Router();
reportRouter.get('/daily', handleDailyReport);
reportRouter.get('/work', handleWorkReport);
reportRouter.get('/work/current', handleCurrentWorkReport);
