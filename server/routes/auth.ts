import { Router } from 'express';
import { Resend } from 'resend';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { supabaseAdmin } from '../supabase';
import { ConfirmSignupEmail } from '../emails/ConfirmSignupEmail';
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail';

export const authRouter = Router();

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Arvid <arvid@arvid.work>';

authRouter.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  console.info('[INFO] [auth:signup] Creating user', JSON.stringify({ email }));

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      redirectTo: `${APP_ORIGIN}/login`,
    },
  });

  if (linkError) {
    console.error('[ERROR] [auth:signup] generateLink failed', JSON.stringify({ error: linkError.message }));

    if (linkError.message.includes('already been registered')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return res.status(400).json({ error: linkError.message });
  }

  const confirmUrl = linkData.properties?.action_link;

  if (!confirmUrl) {
    console.error('[ERROR] [auth:signup] No action_link in response');
    return res.status(500).json({ error: 'Failed to generate confirmation link' });
  }

  if (resend) {
    try {
      const html = await render(
        createElement(ConfirmSignupEmail, { url: confirmUrl, email }),
      );

      const { error: sendError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [email],
        subject: 'Confirm your Arvid account',
        html,
        text: `Confirm your Arvid account\n\nClick here to verify your email:\n${confirmUrl}`,
      });

      if (sendError) {
        console.error('[ERROR] [auth:signup] Email send failed', JSON.stringify({ error: sendError.message }));
      } else {
        console.info('[INFO] [auth:signup] Confirmation email sent', JSON.stringify({ email }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ERROR] [auth:signup] Email render/send failed', JSON.stringify({ error: message }));
    }
  } else {
    console.warn('[WARN] [auth:signup] Resend not configured, confirmation email not sent');
  }

  res.json({ message: 'Check your email to confirm your account' });
});

authRouter.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  console.info('[INFO] [auth:resetPassword] Generating reset link', JSON.stringify({ email }));

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${APP_ORIGIN}/reset-password`,
    },
  });

  if (linkError) {
    console.error('[ERROR] [auth:resetPassword] generateLink failed', JSON.stringify({ error: linkError.message }));
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  const resetUrl = linkData.properties?.action_link;

  if (!resetUrl) {
    return res.json({ message: 'If an account exists, a reset link has been sent' });
  }

  if (resend) {
    try {
      const html = await render(
        createElement(ResetPasswordEmail, { url: resetUrl, email }),
      );

      const { error: sendError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [email],
        subject: 'Reset your Arvid password',
        html,
        text: `Reset your Arvid password\n\nClick here to reset:\n${resetUrl}`,
      });

      if (sendError) {
        console.error('[ERROR] [auth:resetPassword] Email send failed', JSON.stringify({ error: sendError.message }));
      } else {
        console.info('[INFO] [auth:resetPassword] Reset email sent', JSON.stringify({ email }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ERROR] [auth:resetPassword] Email render/send failed', JSON.stringify({ error: message }));
    }
  } else {
    console.warn('[WARN] [auth:resetPassword] Resend not configured, reset email not sent');
  }

  res.json({ message: 'If an account exists, a reset link has been sent' });
});
