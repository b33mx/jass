import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function companyContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const recipientId = req.headers['x-line-recipient-id'];
  const lineUserId = typeof recipientId === 'string' && recipientId.trim() ? recipientId.trim() : 'public';

  req.lineUser = {
    lineUserId,
    companyId: env.DEFAULT_COMPANY_ID,
    role: 'admin',
  };

  next();
}
