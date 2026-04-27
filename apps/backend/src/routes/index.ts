import type { Express } from 'express';
import { healthRouter } from './health.route.ts';
import { lineWebhookRouter } from './line-webhook.route.ts';

export function registerRoutes(app: Express) {
  app.use('/health', healthRouter);
  app.use('/webhook/line', lineWebhookRouter);
  app.use('/webhook', lineWebhookRouter);
}
