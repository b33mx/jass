import type { Request, Response, NextFunction } from 'express';
import { getLineUserByLineId } from '../modules/line-users/line-user.repository.js';

export async function lineAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Token-based report links are self-contained (companyId embedded in signed token)
  if (req.path === '/reports/access' && req.query.t) {
    return next();
  }

  const lineUserId = req.headers['x-line-user-id'];

  if (!lineUserId || typeof lineUserId !== 'string') {
    res.status(401).json({ error: 'กรุณาเปิดผ่าน LINE' });
    return;
  }

  try {
    const user = await getLineUserByLineId(lineUserId);

    if (!user) {
      res.status(403).json({ error: 'ไม่พบผู้ใช้ในระบบ' });
      return;
    }

    if (!user.company_id) {
      res.status(403).json({ error: 'กรุณาติดต่อ admin เพื่อตั้งค่าเบื้องต้น' });
      return;
    }

    req.lineUser = { lineUserId, companyId: user.company_id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}
