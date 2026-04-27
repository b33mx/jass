import type { Express } from 'express';
import { employeeRouter } from '../modules/employees/employee.route.ts';
import { healthRouter } from './health.route.ts';
import { lineWebhookRouter } from './line-webhook.route.ts';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/webhook/line', lineWebhookRouter);
  app.use('/webhook', lineWebhookRouter);
  app.use('/api/employees', employeeRouter);
}
