import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

router.post('/email-requirement', async (req, res) => {
  const { to, url, requirementTitle } = req.body;

  if (!to || !url) {
    return res.status(400).json({ error: 'Missing required fields: to, url' });
  }

  if (!resend) {
    return res.status(503).json({ error: 'Email service not configured. Set RESEND_API_KEY.' });
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Arvid <noreply@arvid.work>';
  const subject = requirementTitle
    ? `Shared requirement: ${requirementTitle}`
    : 'A requirement has been shared with you';

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: [to],
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 18px; font-weight: 500; color: #1a1a1a; margin-bottom: 16px;">
          ${requirementTitle || 'Requirement shared with you'}
        </h2>
        <p style="font-size: 14px; color: #555; line-height: 1.5; margin-bottom: 24px;">
          Someone shared a requirement with you on Arvid. Click below to view it.
        </p>
        <a href="${url}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px;">
          View Requirement
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px;">
          <a href="${url}" style="color: #999; text-decoration: underline;">${url}</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[ERROR] [share:email-requirement] Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  res.json({ success: true });
});

export const shareRouter = router;
