import { Router } from 'express';
import {
  handleGetAttendance,
  handleGetMissingDates,
  handleSaveAttendanceBatch,
} from './attendance.controller.ts';

export const attendanceRouter = Router();

attendanceRouter.get('/missing-dates', handleGetMissingDates);
attendanceRouter.get('/', handleGetAttendance);
attendanceRouter.post('/batch', handleSaveAttendanceBatch);
