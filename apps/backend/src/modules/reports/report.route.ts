import { Router } from 'express';
import {
  handleCreateReportLink,
  handleCurrentWorkReport,
  handleDailyReport,
  handlePayrollPacketReport,
  handleReportAccess,
  handleTimecardReport,
  handleWorkReport,
} from './report.controller.js';

export const reportRouter = Router();
reportRouter.post('/link', handleCreateReportLink);
reportRouter.get('/access', handleReportAccess);
reportRouter.get('/daily', handleDailyReport);
reportRouter.get('/work', handleWorkReport);
reportRouter.get('/work/current', handleCurrentWorkReport);
reportRouter.get('/timecard', handleTimecardReport);
reportRouter.get('/payroll-packet', handlePayrollPacketReport);
