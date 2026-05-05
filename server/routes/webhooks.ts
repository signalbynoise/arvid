import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabase } from '../supabase';

export const webhooksRouter = Router();

function verifyLinearSignature(signature: string | undefined, rawBody: Buffer): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const computed = createHmac('sha256', secret).update(rawBody).digest();
  const provided = Buffer.from(signature, 'hex');

  if (computed.length !== provided.length) return false;
  return timingSafeEqual(computed, provided);
}

webhooksRouter.post('/linear', async (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    console.error('[ERROR] [webhooks:linear] Missing raw body for signature verification');
    return res.sendStatus(400);
  }

  const signature = req.get('linear-signature');
  if (!verifyLinearSignature(signature, rawBody)) {
    console.error('[ERROR] [webhooks:linear] Invalid signature');
    return res.sendStatus(401);
  }

  const { action, type, data, webhookTimestamp } = req.body;

  if (Math.abs(Date.now() - webhookTimestamp) > 60_000) {
    console.error('[ERROR] [webhooks:linear] Stale webhook timestamp');
    return res.sendStatus(401);
  }

  if (type !== 'Issue' || action !== 'update') {
    return res.sendStatus(200);
  }

  const linearIssueId = data?.id;
  const stateName = data?.state?.name;
  const stateType = data?.state?.type;

  if (!linearIssueId || !stateName) {
    return res.sendStatus(200);
  }

  console.info('[INFO] [webhooks:linear] Issue status update received', JSON.stringify({
    linearIssueId,
    stateName,
    stateType,
  }));

  const { error } = await supabase
    .from('requirements')
    .update({
      linear_status: stateName,
      linear_status_type: stateType ?? null,
    })
    .eq('linear_issue_id', linearIssueId);

  if (error) {
    console.error('[ERROR] [webhooks:linear] Failed to update requirement', JSON.stringify({ error: error.message }));
    return res.sendStatus(500);
  }

  res.sendStatus(200);
});
