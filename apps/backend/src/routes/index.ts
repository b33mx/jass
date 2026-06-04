import type { Express } from 'express';
import { attendanceRouter } from '../modules/attendance/attendance.route.js';
import { employeeRouter } from '../modules/employees/employee.route.js';
import { periodRouter } from '../modules/periods/period.route.js';
import { taskRouter } from '../modules/tasks/task.route.js';
import { reportRouter } from '../modules/reports/report.route.js';
import { healthRouter } from './health.route.js';
import { lineWebhookRouter } from './line-webhook.route.js';
import { lineAuthMiddleware } from '../middleware/line-auth.js';
import { handleReportAccess } from '../modules/reports/report.controller.js';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/webhook/line', lineWebhookRouter);
  app.use('/webhook', lineWebhookRouter);

  // report access ต้องอยู่ก่อน lineAuthMiddleware เพราะ link เปิดใน browser ไม่มี LINE auth header
  app.get('/api/reports/access', handleReportAccess);

  app.use('/api', lineAuthMiddleware);
  app.use('/api/employees', employeeRouter);
  app.use('/api/periods', periodRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/reports', reportRouter);
}
