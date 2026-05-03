import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
      }));

      console.warn(
        `[WARN] [validation:${req.method} ${req.path}] Request body validation failed`,
        JSON.stringify({ issues }),
      );

      res.status(400).json({ error: 'Validation failed', issues });
      return;
    }

    req.body = result.data;
    next();
  };
}
