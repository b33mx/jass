export {};
declare global {
  namespace Express {
    interface Request {
      lineUser?: { lineUserId: string; companyId: number; role: string };
    }
  }
}
