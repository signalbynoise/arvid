import type { Request, Response, NextFunction } from 'express';

const CMS_SUPER_ADMIN_ID = '926ede11-3607-446e-a7aa-400bd22635ff';

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.id !== CMS_SUPER_ADMIN_ID) {
    console.warn('[WARN] [auth:superAdmin] Non-admin access attempt', JSON.stringify({ userId: req.user?.id }));
    res.status(403).json({ error: 'Access restricted to super admin' });
    return;
  }
  next();
}
