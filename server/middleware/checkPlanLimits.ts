import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase';
import { PLAN_LIMITS } from '../../shared/schemas/subscription';
import type { SubscriptionPlan } from '../../shared/schemas/subscription';

async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const { data } = await supabaseAdmin
    .from('user_subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  if (!data) return 'free';

  if (data.plan === 'plus' && data.status === 'active') {
    return 'plus';
  }

  return 'free';
}

export async function checkProjectLimit(req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (limits.maxProjects === Infinity) {
    return next();
  }

  const { count, error } = await supabaseAdmin
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) {
    console.error('[ERROR] [planLimits:project] Failed to count projects', JSON.stringify({ userId, error: error.message }));
    return next();
  }

  if ((count ?? 0) >= limits.maxProjects) {
    console.info('[INFO] [planLimits:project] Limit reached', JSON.stringify({ userId, plan, count, limit: limits.maxProjects }));
    return res.status(403).json({
      error: 'plan_limit_reached',
      message: `Your ${plan} plan allows up to ${limits.maxProjects} project(s). Upgrade to Arvid Plus for unlimited projects.`,
      limit: limits.maxProjects,
      current: count,
    });
  }

  next();
}

export async function checkRequirementLimit(req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const projectId = req.body.project_id;

  if (!projectId) return next();

  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  if (limits.maxRequirementsPerProject === Infinity) {
    return next();
  }

  const { count, error } = await supabaseAdmin
    .from('requirements')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_deactivated', false);

  if (error) {
    console.error('[ERROR] [planLimits:requirement] Failed to count requirements', JSON.stringify({ userId, projectId, error: error.message }));
    return next();
  }

  if ((count ?? 0) >= limits.maxRequirementsPerProject) {
    console.info('[INFO] [planLimits:requirement] Limit reached', JSON.stringify({ userId, plan, projectId, count, limit: limits.maxRequirementsPerProject }));
    return res.status(403).json({
      error: 'plan_limit_reached',
      message: `Your ${plan} plan allows up to ${limits.maxRequirementsPerProject} requirements per project. Upgrade to Arvid Plus for unlimited requirements.`,
      limit: limits.maxRequirementsPerProject,
      current: count,
    });
  }

  next();
}
