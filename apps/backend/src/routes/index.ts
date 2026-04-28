import type { Express } from 'express';
import { attendanceRouter } from '../modules/attendance/attendance.route.ts';
import { employeeRouter } from '../modules/employees/employee.route.ts';
import { periodRouter } from '../modules/periods/period.route.ts';
import { taskRouter } from '../modules/tasks/task.route.ts';
import { healthRouter } from './health.route.ts';
import { lineWebhookRouter } from './line-webhook.route.ts';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/webhook/line', lineWebhookRouter);
  app.use('/webhook', lineWebhookRouter);
  app.use('/api/employees', employeeRouter);
  app.use('/api/periods', periodRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/tasks', taskRouter);
}
