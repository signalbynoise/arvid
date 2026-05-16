import { Router } from 'express';
import { Resend } from 'resend';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { ShareRequirementEmail } from '../emails/ShareRequirementEmail';

const router = Router();

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Arvid <arvid@arvid.work>';

router.post('/email-requirement', async (req, res) => {
  const { to, url, requirementTitle } = req.body;

  if (!to || !url) {
    return res.status(400).json({ error: 'Missing required fields: to, url' });
  }

  if (!resend) {
    console.warn('[WARN] [share:email-requirement] Resend not configured');
    return res.status(503).json({ error: 'Email service not configured. Set RESEND_API_KEY.' });
  }

  const subject = requirementTitle
    ? `Shared requirement: ${requirementTitle}`
    : 'A requirement has been shared with you';

  const idempotencyKey = `share-requirement/${to}/${encodeURIComponent(url)}`;

  const html = await render(
    createElement(ShareRequirementEmail, { url, requirementTitle }),
  );

  const plainText = [
    requirementTitle || 'Requirement shared with you',
    '',
    'Someone shared a requirement with you on Arvid.',
    'View it here:',
    url,
  ].join('\n');

  console.info(
    '[INFO] [share:email-requirement] Sending share email',
    JSON.stringify({ to, subject }),
  );

  const { data, error } = await resend.emails.send(
    {
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      text: plainText,
    },
    { idempotencyKey },
  );

  if (error) {
    console.error(
      '[ERROR] [share:email-requirement] Resend error',
      JSON.stringify({ to, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to send email' });
  }

  console.info(
    '[INFO] [share:email-requirement] Email sent',
    JSON.stringify({ to, emailId: data?.id }),
  );

  res.json({ success: true });
});

export const shareRouter = router;
