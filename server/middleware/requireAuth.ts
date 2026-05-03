import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
      accessToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error(`[ERROR] [auth:verify] Token verification failed: ${error?.message ?? 'no user'}`);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { id: user.id, email: user.email };
  req.accessToken = token;
  next();
}
