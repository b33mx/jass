import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
  const status = (err as any).status || 500;

  // Log error for debugging
  console.error(`[error] ${message}`, err);

  res.status(status).json({
    error: message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
